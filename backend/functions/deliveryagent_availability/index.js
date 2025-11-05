require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- Middleware ---
app.use(cors({
  origin: [
    'https://aroundu-frontend-164909903360.asia-south1.run.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

/**
 * @route   PATCH /
 * @desc    Update delivery agent availability (and optionally location)
 * @access  Private (delivery_agent)
 */
app.patch('/', auth, async (req, res) => {
  await connectDB();
  try {
    const { availability, latitude, longitude } = req.body;
    const userId = req.user.id;

    // 1️⃣ Validate user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    if (user.role !== 'delivery_agent') return res.status(403).json({ msg: 'Access denied: Not a delivery agent.' });

    // 2️⃣ Prepare updates
    const updates = {};
    if (typeof availability === 'boolean') updates.availability = availability;

    if (latitude && longitude) {
      updates.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ msg: 'No valid fields provided to update.' });
    }

    // 3️⃣ Update the delivery agent
    const updatedAgent = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      msg: 'Availability updated successfully',
      availability: updatedAgent.availability,
      location: updatedAgent.location || null,
    });
  } catch (err) {
    console.error('Error updating availability:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /
 * @desc    Get current availability and location of the delivery agent
 * @access  Private (delivery_agent)
 */
app.get('/', auth, async (req, res) => {
  await connectDB();
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('availability location role');

    if (!user) return res.status(404).json({ msg: 'User not found.' });
    if (user.role !== 'delivery_agent') return res.status(403).json({ msg: 'Access denied: Not a delivery agent.' });

    return res.status(200).json({
      msg: 'Fetched availability successfully',
      availability: user.availability || false,
      location: user.location || null,
    });
  } catch (err) {
    console.error('Error fetching availability:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

exports.delivery_availability = app;
