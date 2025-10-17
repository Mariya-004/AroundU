const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- CORS Configuration ---
const FRONTEND_URL = 'https://aroundu-frontend-164909903360.asia-south1.run.app';
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Handle OPTIONS preflight
app.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', FRONTEND_URL);
  res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send('');
});

/**
 * GET /get_product?id=<productId>
 * Returns detailed info of the product and its shop.
 */
app.get('/', auth, async (req, res) => {
  try {
    await connectDB();
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ msg: 'Product ID is required.' });
    }

    // Find the shop that contains this product
    const shop = await Shop.findOne({ 'products._id': mongoose.Types.ObjectId(id) });

    if (!shop) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    // Extract the product details
    const product = shop.products.id(id);

    // Combine shop info and product details
    const detailedProduct = {
      shopId: shop._id,
      shopName: shop.name,
      shopAddress: shop.address,
      productId: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl || null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return res.status(200).json({
      msg: 'Product details fetched successfully.',
      product: detailedProduct,
    });

  } catch (err) {
    console.error('Error in get_product endpoint:', err);
    return res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.get_product = app;
