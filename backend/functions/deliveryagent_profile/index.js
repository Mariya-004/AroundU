const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * @route   POST /agent/profile
 * @desc    Update a delivery agent's profile
 * @access  Private (Requires delivery agent role)
 */
app.post('/agent/profile', auth, async (req, res) => {
  await connectDB();

  const {
    fullName,
    email,
    phoneNumber,   // <-- NEW FIELD
    vehicleType,
    currentLocation
  } = req.body;

  try {
    const userId = req.user.id;

    const fieldsToUpdate = {};
    if (fullName) fieldsToUpdate.name = fullName;
    if (email) fieldsToUpdate.email = email;
    if (phoneNumber) fieldsToUpdate.phoneNumber = phoneNumber;
    if (vehicleType) fieldsToUpdate.vehicleType = vehicleType;
    if (currentLocation) fieldsToUpdate.currentLocation = currentLocation;

    const updatedAgent = await User.findByIdAndUpdate(
      userId,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedAgent) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    if (updatedAgent.role !== 'delivery_agent') {
      return res.status(403).json({ msg: 'Forbidden: User is not a delivery agent.' });
    }

    res.status(200).json({
      msg: 'Delivery agent profile updated successfully',
      agent: updatedAgent
    });

  } catch (err) {
    console.error("Error details:", err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'This email or phone number is already in use.' });
    }
    res.status(500).send('Server error');
  }
});

exports.deliveryagent_profile = app;
