require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();
connectDB();

// --- FRONTEND ORIGIN (production & local fallback) ---
const FRONTEND_URL = 'https://aroundu-frontend-164909903360.asia-south1.run.app';
const LOCAL_URL = 'http://localhost:5173'; // for local dev

// --- CORS ---
app.use(
  cors({
    origin: [FRONTEND_URL, LOCAL_URL],
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json());

// ✅ Explicit preflight handler
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if ([FRONTEND_URL, LOCAL_URL].includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send('');
});

/**
 * @route   PATCH /shops/:shopId/products/:productId
 * @desc    Update a product
 * @access  Private (Shopkeeper)
 */
app.patch('/shops/:shopId/products/:productId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Only shopkeepers can edit products.' });
    }

    const { shopId, productId } = req.params;
    const { name, description, price, stock, imageUrl } = req.body;

    const shop = await Shop.findOne({ _id: shopId, shopkeeperId: req.user.id });
    if (!shop) return res.status(404).json({ msg: 'Shop not found or unauthorized.' });

    const product = shop.products.id(productId);
    if (!product) return res.status(404).json({ msg: 'Product not found.' });

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (stock !== undefined) product.stock = parseInt(stock, 10);
    if (imageUrl !== undefined) product.imageUrl = imageUrl;

    await shop.save();

    return res.status(200).json({
      msg: '✅ Product updated successfully!',
      updatedProduct: product,
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.edit_product = app;
