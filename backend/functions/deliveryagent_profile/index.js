const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');
const NodeGeocoder = require('node-geocoder');

const app = express();

// Middleware // Apply CORS and JSON parsing
app.use(cors({ origin: true }));
app.use(express.json());
// --- START: GEOCODER SETUP ---
const options = {
 // provider: process.env.GEOCODER_PROVIDER || 'openstreetmap', // Use openstreetmap as a default provider
 // apiKey: process.env.GEOCODER_API_KEY, 
  formatter: null
};
const geocoder = NodeGeocoder(options);

/**
 * @route   POST /agent/profile
 * @desc    Update a delivery agent's profile
 * @access  Private (Requires delivery agent role)
 */
app.post('/', auth, async (req, res) => { // ROUTE IS /agent/profile now
  await connectDB();

  const {
    fullName,
    email,
    phoneNumber,
    vehicleType,
    currentLocation // Can be an address string or [lon, lat] array
  } = req.body;

  try {
    const userId = req.user.id;

    // 1. Fetch the user first and check role immediately
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    if (user.role !== 'delivery_agent') {
      return res.status(403).json({ msg: 'Forbidden: User is not a delivery agent.' });
    }

    // 2. Prepare fields for update
    const fieldsToUpdate = {};
    if (fullName) fieldsToUpdate.name = fullName;
    if (email) fieldsToUpdate.email = email;
    if (phoneNumber) fieldsToUpdate.phoneNumber = phoneNumber;
    if (vehicleType) fieldsToUpdate.vehicleType = vehicleType;
    
    // 3. Handle Location Update with Geocoding
    if (currentLocation) {
      let geoPoint;

      if (typeof currentLocation === 'string') {
        // Option A: Client sent an address string, use Geocoder
        const geoResults = await geocoder.geocode(currentLocation);

        if (!geoResults || geoResults.length === 0) {
          return res.status(400).json({ msg: 'Could not find coordinates for the provided address.' });
        }

        const { latitude, longitude } = geoResults[0];
        // MongoDB GeoJSON Point format is [longitude, latitude]
        geoPoint = {
          type: 'Point',
          coordinates: [longitude, latitude]
        };

      } else if (Array.isArray(currentLocation) && currentLocation.length === 2) {
        // Option B: Client sent [longitude, latitude] array
        geoPoint = {
          type: 'Point',
          coordinates: currentLocation
        };
      } else {
        return res.status(400).json({ msg: 'Invalid currentLocation format. Must be an address string or an array: [longitude, latitude]' });
      }

      fieldsToUpdate.currentLocation = geoPoint;
    }
    
    // 4. Perform the update
    // The role check is done above, so we can proceed with the update confidently.
    const updatedAgent = await User.findByIdAndUpdate(
      userId,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      msg: 'Delivery agent profile updated successfully',
      agent: updatedAgent
    });

  } catch (err) {
    console.error("Error details:", err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'This email or phone number is already in use.' });
    }
    // Handle validation errors from runValidators: true
    if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: `Validation Failed: ${err.message}` });
    }
    res.status(500).send('Server error');
  }
});

// Changed export name to match the new route/purpose
exports.deliveryagent_profile_update = app;
