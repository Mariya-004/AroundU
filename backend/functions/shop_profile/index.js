const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Apply middleware
app.use(cors({ origin: true }));
app.use(express.json());

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

    // --- FIX: Use 'shopkeeperId' instead of 'owner' ---
    let shop = await Shop.findOne({ shopkeeperId: userId });

    if (shop) {
      shop = await Shop.findOneAndUpdate(
        // --- FIX: Use 'shopkeeperId' instead of 'owner' ---
        { shopkeeperId: userId },
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
      // --- FIX: Use 'shopkeeperId' instead of 'owner' ---
      shopkeeperId: userId,
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
    console.error("Error details:", err); // Enhanced logging
    res.status(500).send('Server error');
  }
});

exports.shop_profile = app;