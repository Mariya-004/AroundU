require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Connect database once
connectDB();

/**
 * @route   GET /
 * @desc    Get all products of the authenticated shopkeeper's shop
 * @access  Private (Requires shopkeeper role)
 */
app.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Only shopkeepers can access this.' });
    }

    const shop = await Shop.findOne({ shopkeeperId: userId });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found for this user.' });
    }

    if (!shop.products || shop.products.length === 0) {
      return res.status(200).json({
        msg: 'No products found in your shop.',
        products: [],
      });
    }

    // Sort products by most recent first
    const sortedProducts = shop.products.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      msg: 'Products fetched successfully!',
      shopName: shop.name,
      shopId: shop._id,
      totalProducts: sortedProducts.length,
      products: sortedProducts.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl || null,
      })),
    });
  } catch (err) {
    console.error('Error fetching shop products:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.shop_products = app;
