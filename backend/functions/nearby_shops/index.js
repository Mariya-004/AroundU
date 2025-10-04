const express = require('express');
const cors = require('cors');
const connectDB = require('../../common/db.js');
const Shop = require('../../common/models/Shop.js');

const app = express();

// Apply middleware
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * @route   GET /
 * @desc    Find nearby shops based on latitude, longitude, and radius
 * @access  Public
 */
app.get('/', async (req, res) => {
  // --- START: MODIFICATION FOR DEBUGGING ---
  // This block will catch a database connection failure immediately.
  try {
    await connectDB();
  } catch (dbError) {
    // If connectDB fails, we send an immediate error response
    // instead of letting the function time out.
    console.error("Database connection failed from within the route handler.", dbError.message);
    return res.status(503).json({ 
      msg: 'Service temporarily unavailable due to a database connection error.',
      error: 'The server could not connect to the database. Please check the function logs for specific auth errors.'
    });
  }
  // --- END: MODIFICATION FOR DEBUGGING ---

  const { lat, lng, radius } = req.query;

  // Basic validation for required query parameters
  if (!lat || !lng) {
    return res.status(400).json({ msg: 'Latitude (lat) and longitude (lng) are required.' });
  }

  try {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Use a default radius of 5km if not provided.
    const searchRadius = radius ? parseFloat(radius) : 5;
    if (isNaN(latitude) || isNaN(longitude) || isNaN(searchRadius)) {
        return res.status(400).json({ msg: 'Invalid location or radius values.' });
    }

    // Convert the search radius from kilometers to meters.
    const radiusInMeters = searchRadius * 1000;

    const shops = await Shop.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusInMeters
        }
      }
    });

    res.status(200).json(shops);
  } catch (err) {
    console.error("Error fetching nearby shops:", err);
    res.status(500).send('Server error');
  }
});


// The container must listen on the port defined by the PORT environment variable.
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});


// Export the Express app for the Cloud Function to use.
exports.nearby_shops = app;

