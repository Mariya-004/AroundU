const express = require('express');
const cors = require('cors');
const NodeGeocoder = require('node-geocoder');
const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// --- Geocoder Setup ---
const options = {
  provider: 'openstreetmap',
  formatter: null
};
const geocoder = NodeGeocoder(options);
//
/**
 * @route   POST /
 * @desc    Update a customer's profile, including geocoding and phone number
 * @access  Private (Requires customer role)
 */
app.post('/', auth, async (req, res) => {
  await connectDB();

  const {
    fullName,
    homeAddress,
    deliveryLocation,
    phoneNumber // <-- ADDED: Destructure phone number from request body
  } = req.body;

  try {
    const userId = req.user.id;

    const fieldsToUpdate = {};
    if (fullName) fieldsToUpdate.name = fullName;
    if (homeAddress) fieldsToUpdate.address = homeAddress;
    if (phoneNumber) fieldsToUpdate.phoneNumber = phoneNumber; // <-- ADDED: Add phone number to update object

    // --- Geocoding Logic ---
    if (deliveryLocation && typeof deliveryLocation === 'string') {
      const geocodedData = await geocoder.geocode(deliveryLocation);

      if (geocodedData && geocodedData.length > 0) {
        const { latitude, longitude } = geocodedData[0];
        fieldsToUpdate.location = {
          type: 'Point',
          coordinates: [longitude, latitude]
        };
      } else {
        console.warn(`Could not geocode delivery location: "${deliveryLocation}"`);
      }
    }

    const updatedCustomer = await User.findByIdAndUpdate(
      userId,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedCustomer) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    if (updatedCustomer.role !== 'customer') {
      return res.status(403).json({ msg: 'Forbidden: User is not a customer.' });
    }

    res.status(200).json({ msg: 'Customer profile updated successfully', customer: updatedCustomer });

  } catch (err) {
    console.error("Error details:", err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'This email is already in use.' });
    }
    res.status(500).send('Server error');
  }
});

exports.customer_profile = app;