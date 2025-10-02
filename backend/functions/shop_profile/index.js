const express = require('express');
const cors = require('cors');
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
  await connectDB();
  const {
    shopName,
    shopAddress,
    shopLocation,
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

    let shop = await Shop.findOne({ owner: userId });

    if (shop) {
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
        { new: true }
      );
      return res.status(200).json({ msg: 'Shop profile updated successfully', shop });
    }

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

// --- START: ADDED THIS SECTION ---
// The PORT environment variable is provided by Cloud Run.
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
// --- END: ADDED THIS SECTION ---


// The export name MUST match the --entry-point in your deployment command.
// Renaming this to 'shop_profile_app' to avoid conflict with the function name.
// Note: If your entry point is 'registerShop', this should be 'exports.registerShop = app'
exports.shop_profile = app;
