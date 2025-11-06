require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- Database Connection ---
connectDB();

// --- CORS Setup ---
const allowedOrigins = [
  'https://aroundu-frontend-164909903360.asia-south1.run.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow Postman/local
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed for this origin.'));
  },
  methods: ['GET', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

/**
 * @route   GET /
 * @desc    Get availability status
 * @access  Private
 *  - Delivery agents can view their own status.
 *  - Shopkeepers can view all delivery agents’ statuses.
 */
app.get('/', auth, async (req, res) => {
  try {
    console.log(`[GET] Availability requested by role: ${req.user.role}`);

    // Allow both shopkeepers and delivery agents to view
    if (!["delivery_agent", "shopkeeper"].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden: Unauthorized role.' });
    }

    if (req.user.role === 'delivery_agent') {
      const user = await User.findById(req.user.id).select('name isAvailable location');
      if (!user) return res.status(404).json({ msg: 'Delivery agent not found.' });
      return res.status(200).json({
        msg: 'Your availability fetched successfully.',
        isAvailable: user.isAvailable || false,
        location: user.location || null,
      });
    }

    // Shopkeeper — view all delivery agents
    const agents = await User.find({ role: 'delivery_agent' })
      .select('name email isAvailable location');
    console.log(`[GET] Shopkeeper fetched ${agents.length} agents`);
    return res.status(200).json({ msg: 'All agents fetched.', agents });

  } catch (err) {
    console.error('Error fetching availability:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

/**
 * @route   PATCH /
 * @desc    Update delivery agent availability and location
 * @access  Private (Delivery Agent Only)
 */
app.patch('/', auth, async (req, res) => {
  try {
    console.log(`[PATCH] Availability update request from role: ${req.user.role}`);
    if (req.user.role !== 'delivery_agent') {
      return res.status(403).json({ msg: 'Forbidden: Only delivery agents can update availability.' });
    }

    const { isAvailable, latitude, longitude } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ msg: 'isAvailable (boolean) is required.' });
    }

    const updateData = { isAvailable };

    if (latitude && longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    const updatedAgent = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('name isAvailable location');

    if (!updatedAgent) {
      return res.status(404).json({ msg: 'Delivery agent not found.' });
    }

    console.log(`[PATCH] ${updatedAgent.name} is now ${updatedAgent.isAvailable ? 'Online' : 'Offline'}`);
    res.status(200).json({
      msg: 'Availability updated successfully.',
      agent: updatedAgent,
    });

  } catch (err) {
    console.error('Error updating availability:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- Export for Google Cloud Function ---
exports.deliveryagent_availability = app;
