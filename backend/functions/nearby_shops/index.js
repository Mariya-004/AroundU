const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * @route   GET /
 * @desc    Find shops within a specified radius from a customer's location
 * @access  Private (Requires any authenticated user)
 * @example /?lat=10.0159&lng=76.3419&radius=5
 */
app.get('/', auth, async (req, res) => {
  await connectDB();

  const { lat, lng, radius } = req.query;

  // --- 1. VALIDATION ---
  if (!lat || !lng) {
    return res.status(400).json({ msg: 'Latitude (lat) and Longitude (lng) query parameters are required.' });
  }

  // Use a default radius of 5km if not provided.
  const searchRadius = radius ? parseFloat(radius) : 5;
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude) || isNaN(searchRadius)) {
    return res.status(400).json({ msg: 'Latitude, Longitude, and Radius must be valid numbers.' });
  }


  // --- 2. GEOSPATIAL QUERY ---
  try {
    // MongoDB's geospatial queries require distance in meters.
    // Convert the search radius from kilometers to meters.
    const radiusInMeters = searchRadius * 1000;

    const shops = await Shop.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            // IMPORTANT: MongoDB requires [longitude, latitude]
            coordinates: [longitude, latitude]
          },
          // Set the maximum distance for the search in meters.
          $maxDistance: radiusInMeters
        }
      }
    });

    if (shops.length === 0) {
      return res.status(404).json({ msg: 'No shops found within the specified radius.', shops: [] });
    }

    res.status(200).json({ msg: `${shops.length} shop(s) found.`, shops });

  } catch (err) {
    console.error("Error finding nearby shops:", err);
    res.status(500).send('Server error');
  }
});
//
exports.nearby_shops = app;

