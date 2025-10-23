require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();
connectDB();

// --- CORS (allow all during development) ---
app.use(cors({
  origin: true,
  methods: ['PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

/**
 * @route   PATCH /shops/:shopId/products/:productId
 * @desc    Update product details of a specific shopkeeper
 * @access  Private (Shopkeeper)
 */
app.patch('/shops/:shopId/products/:productId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Only shopkeepers can edit products.' });
    }

    const { shopId, productId } = req.params;
    const { name, description, price, stock, imageUrl } = req.body;

    const shop = await Shop.findOne({ _id: shopId, shopkeeperId: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found or unauthorized.' });
    }

    const product = shop.products.id(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    // --- Update only the provided fields ---
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = parseFloat(price);
    if (stock) product.stock = parseInt(stock, 10);
    if (imageUrl) product.imageUrl = imageUrl;

    await shop.save();

    res.status(200).json({
      msg: 'Product updated successfully!',
      updatedProduct: product,
    });

  } catch (err) {
    console.error('Error updating product:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.edit_product = app;
