const express = require('express');
const cors = require('cors');
const NodeGeocoder = require('node-geocoder'); // <-- Added for geocoding
const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// --- START: GEOCODER SETUP ---
const options = {
  provider: 'openstreetmap',
  formatter: null
};
const geocoder = NodeGeocoder(options);
// --- END: GEOCODER SETUP ---


/**
 * @route   POST /
 * @desc    Update a customer's profile, including geocoding a specific delivery location
 * @access  Private (Requires customer role)
 */
app.post('/', auth, async (req, res) => {
  await connectDB();

  const {
    fullName,
    homeAddress,
    deliveryLocation // <-- NEW FIELD for specific location coordinates
  } = req.body;

  try {
    const userId = req.user.id;

    const fieldsToUpdate = {};
    if (fullName) fieldsToUpdate.name = fullName;
    if (homeAddress) fieldsToUpdate.address = homeAddress; // Save the home address


    // --- START: UPDATED GEOCODING LOGIC ---
    // If a specific delivery location is provided, geocode it.
    if (deliveryLocation && typeof deliveryLocation === 'string') {
      const geocodedData = await geocoder.geocode(deliveryLocation);

      // We only add the location coordinates if they are successfully found.
      if (geocodedData && geocodedData.length > 0) {
        const { latitude, longitude } = geocodedData[0];
        fieldsToUpdate.location = {
          type: 'Point',
          coordinates: [longitude, latitude]
        };
      } else {
        // Optional: Inform the user if the delivery location couldn't be found.
        // For now, we'll just proceed without updating coordinates.
        console.warn(`Could not geocode delivery location: "${deliveryLocation}"`);
      }
    }
    // --- END: UPDATED GEOCODING LOGIC ---


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