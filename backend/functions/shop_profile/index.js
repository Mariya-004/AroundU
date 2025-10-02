const express = require('express');
const cors = require('cors');

// Import shared modules
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/middleware/auth.js');

const app = express();

// Apply middleware
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * @route   POST /
 * @desc    Create or update a shop profile for a logged-in shopkeeper
 * @access  Private (Requires JWT authentication)
 */
app.post('/', auth, async (req, res) => {
  // Establish database connection
  await connectDB();

  // Destructure the shop details from the request body
  const {
    shopName,
    shopAddress,
    shopLocation, // Expecting an object like { lat: Number, lng: Number }
    shopPhoneNumber,
    shopCategory,
    shopDescription,
  } = req.body;

  try {
    // The user's ID is available from the 'auth' middleware via req.user.id
    const userId = req.user.id;

    // First, check if the user has the 'shopkeeper' role
    const user = await User.findById(userId);
    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
    }

    // Check if this user already has a shop
    let shop = await Shop.findOne({ owner: userId });

    if (shop) {
      // If shop exists, update it
      shop = await Shop.findOneAndUpdate(
        { owner: userId },
        {
          $set: {
            name: shopName,
            address: shopAddress,
            location: shopLocation,
            phoneNumber: shopPhoneNumber,
            category: shopCategory,
            description: shopDescription,
          },
        },
        { new: true } // Return the updated document
      );
      return res.status(200).json({ msg: 'Shop profile updated successfully', shop });
    }

    // If no shop exists, create a new one
    shop = new Shop({
      owner: userId,
      name: shopName,
      address: shopAddress,
      location: shopLocation,
      phoneNumber: shopPhoneNumber,
      category: shopCategory,
      description: shopDescription,
    });

    await shop.save();

    res.status(201).json({ msg: 'Shop profile created successfully', shop });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Export the app as 'registerShop' for the cloud function
exports.registerShop = app;
