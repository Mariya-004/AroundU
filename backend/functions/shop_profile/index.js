const express = require('express');
const cors = require('cors');
const NodeGeocoder = require('node-geocoder'); // <-- ADD THIS LINE
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Apply middleware
app.use(cors({ origin: true }));
app.use(express.json());

// --- START: GEOCODER SETUP ---
const options = {
  provider: 'openstreetmap',
  // Optional: add your own API key if you have one
  // apiKey: 'YOUR_API_KEY',
  formatter: null // 'gpx', 'string', ...
};
const geocoder = NodeGeocoder(options);
// --- END: GEOCODER SETUP ---


app.post('/', auth, async (req, res) => {
  await connectDB();
  const {
    shopName,
    shopAddress,
    shopLocation, // This will now be a place name like "Lulu Mall, Kochi"
    shopPhoneNumber,
    shopCategory,
    shopDescription,
  } = req.body;

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
    }

    // --- START: NEW GEOCODING LOGIC ---
    if (!shopLocation || typeof shopLocation !== 'string') {
        return res.status(400).json({ msg: 'shopLocation (the place name) is required.' });
    }

    // Use the geocoder to find the coordinates for the given place name
    const geocodedData = await geocoder.geocode(shopLocation);

    // Handle cases where the location could not be found
    if (!geocodedData || geocodedData.length === 0) {
        return res.status(400).json({
            msg: `Could not find coordinates for the location: "${shopLocation}". Please try a more specific address or place name.`
        });
    }

    // Extract latitude and longitude from the first result
    const { latitude, longitude } = geocodedData[0];

    // Construct the correct GeoJSON object for the database
    // IMPORTANT: MongoDB requires the format [longitude, latitude]
    const locationForDb = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    // --- END: NEW GEOCODING LOGIC ---


    let shop = await Shop.findOne({ shopkeeperId: userId });

    if (shop) {
      shop = await Shop.findOneAndUpdate(
        { shopkeeperId: userId },
        {
          $set: {
            name: shopName,
            address: shopAddress,
            location: locationForDb, // Use the geocoded object
            phoneNumber: shopPhoneNumber,
            category: shopCategory,
            description: shopDescription,
          },
        },
        { new: true }
      );
      return res.status(200).json({ msg: 'Shop profile updated successfully', shop });
    }

    shop = new Shop({
      shopkeeperId: userId,
      name: shopName,
      address: shopAddress,
      location: locationForDb, // Use the geocoded object
      phoneNumber: shopPhoneNumber,
      category: shopCategory,
      description: shopDescription,
    });

    await shop.save();
    res.status(201).json({ msg: 'Shop profile created successfully', shop });
  } catch (err) {
    console.error("Error details:", err);
    res.status(500).send('Server error');
  }
});

exports.shop_profile = app;