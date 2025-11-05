require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- Database Connection ---
// Connect once globally for efficiency in Cloud Functions
connectDB();

// --- CORS Configuration ---
const allowedOrigins = [
  'https://aroundu-frontend-164909903360.asia-south1.run.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow Postman or local calls with no origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- JSON Parser ---
app.use(express.json());

/**
 * @route   GET /
 * @desc    Get the current availability status of the logged-in delivery agent
 * @access  Private (Delivery Agent Only)
 */
app.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Only shopkeeper can access this.' });
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'Delivery agent not found.' });
    }

    return res.status(200).json({
      msg: 'Availability fetched successfully.',
      isAvailable: user.isAvailable || false,
      location: user.location || null,
    });

  } catch (err) {
    console.error('Error fetching availability:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});


/**
 * @route   PATCH /
 * @desc    Update delivery agent availability (online/offline) and optionally live location
 * @access  Private (Delivery Agent Only)
 */
app.patch('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_agent') {
      return res.status(403).json({ msg: 'Forbidden: Only delivery agents can update availability.' });
    }

    const { isAvailable, latitude, longitude } = req.body;

    // Basic validation
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ msg: 'isAvailable (boolean) is required.' });
    }

    const updateData = { isAvailable };

    if (latitude && longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON expects [lng, lat]
      };
    }

    const updatedAgent = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedAgent) {
      return res.status(404).json({ msg: 'Delivery agent not found.' });
    }

    res.status(200).json({
      msg: 'Availability updated successfully.',
      agent: {
        id: updatedAgent._id,
        name: updatedAgent.name,
        isAvailable: updatedAgent.isAvailable,
        location: updatedAgent.location || null,
      }
    });

  } catch (err) {
    console.error('Error updating availability:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- Export the function for Google Cloud Function Deployment ---
exports.deliveryagent_availability = app;
