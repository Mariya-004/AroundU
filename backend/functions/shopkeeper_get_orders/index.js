const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// --- Use correct relative paths ---
const connectDB = require('./common/db.js');
const auth = require('./common/authMiddleware.js');
const Order = require('./common/models/Order.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js'); // Needed for populate

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// --- GET / ---
// Fetches all orders for the currently logged-in shopkeeper
app.get('/', auth, async (req, res) => {
  await connectDB();

  try {
    const shopkeeperId = req.user.id;
    const userRole = req.user.role;

    // 1. Check if user is a shopkeeper
    if (userRole !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: You are not a shopkeeper.' });
    }

    // 2. Find all shops owned by this shopkeeper
    // We only need the _id field from the shops
    const shops = await Shop.find({ shopkeeperId: shopkeeperId }).select('_id');

    if (!shops || shops.length === 0) {
      // This is not an error, the shopkeeper just has no shops
      return res.json([]);
    }

    // 3. Create an array of this shopkeeper's shop IDs
    const shopIds = shops.map(shop => shop._id);

    // 4. Find all orders where the shopId is in our array of shop IDs
    const orders = await Order.find({ shopId: { $in: shopIds } })
      .populate('customerId', 'name email') // Populate customer details
      .sort({ createdAt: -1 }); // Show newest orders first

    // 5. Return the list of orders
    res.json(orders);

  } catch (err) {
    console.error('Get shop orders error:', err);
    res.status(500).json({ msg: 'Server error while fetching orders.' });
  }
});

exports.get_shop_orders = app;