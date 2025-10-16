const express = require('express');
const cors = require('cors');
const NodeGeocoder = require('node-geocoder');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- Middleware ---
app.use(cors({ origin: true }));
app.use(express.json());

// --- Geocoder Setup ---
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  formatter: null,
});

/**
 * @route   GET /
 * @desc    Fetch the logged-in shopkeeper's shop profile
 * @access  Private (Requires authentication)
 */
app.get('/', auth, async (req, res) => {
  await connectDB();

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Only shopkeepers can access this.' });
    }

    const shop = await Shop.findOne({ shopkeeperId: userId });

    if (!shop) {
      return res.status(200).json({
        msg: 'No shop profile found for this user.',
        shopExists: false,
        shop: null,
      });
    }

    res.status(200).json({
      msg: 'Shop profile fetched successfully.',
      shopExists: true,
      shop,
    });
  } catch (err) {
    console.error('Error fetching shop profile:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /
 * @desc    Create or update shop profile for shopkeeper
 * @access  Private (Requires authentication)
 */
app.post('/', auth, async (req, res) => {
  await connectDB();

  try {
    const {
      shopName,
      shopAddress,
      shopLocation, // place name or address
      shopPhoneNumber,
      shopCategory,
      shopDescription,
    } = req.body;

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Only shopkeepers can create or update a shop.' });
    }

    // --- Validate and geocode shopLocation ---
    if (!shopLocation || typeof shopLocation !== 'string') {
      return res.status(400).json({ msg: 'shopLocation (place name or address) is required.' });
    }

    const geoResult = await geocoder.geocode(shopLocation);
    if (!geoResult || geoResult.length === 0) {
      return res.status(400).json({
        msg: `Could not find coordinates for "${shopLocation}". Try a more specific address.`,
      });
    }

    const { latitude, longitude } = geoResult[0];
    const locationForDb = {
      type: 'Point',
      coordinates: [longitude, latitude], // MongoDB expects [lng, lat]
    };

    // --- Check if shop already exists ---
    let shop = await Shop.findOne({ shopkeeperId: userId });

    if (shop) {
      shop = await Shop.findOneAndUpdate(
        { shopkeeperId: userId },
        {
          $set: {
            name: shopName,
            address: shopAddress,
            locationName: shopLocation, // ✅ save readable location name
            location: locationForDb,
            phoneNumber: shopPhoneNumber,
            category: shopCategory,
            description: shopDescription,
          },
        },
        { new: true }
      );
      return res.status(200).json({ msg: 'Shop profile updated successfully', shop });
    }

    // --- Create a new shop ---
    shop = new Shop({
      shopkeeperId: userId,
      name: shopName,
      address: shopAddress,
      locationName: shopLocation, // ✅ added field
      location: locationForDb,
      phoneNumber: shopPhoneNumber,
      category: shopCategory,
      description: shopDescription,
    });

    await shop.save();
    res.status(201).json({ msg: 'Shop profile created successfully', shop });

  } catch (err) {
    console.error('Error in shop profile POST:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

exports.shop_profile = app;
