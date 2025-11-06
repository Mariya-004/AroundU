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

// Handle OPTIONS preflight manually for Cloud Functions
app.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', FRONTEND_URL);
  res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send('');
});

app.use(express.json());

// --- Connect to Database once on cold start ---
connectDB();

/**
 * @route   GET /
 * @desc    Get detailed info about a single product (with its shop)
 * @access  Private (requires auth)
 * Example: GET /?id=PRODUCT_ID
 */
app.get('/', auth, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ msg: 'Product ID is required.' });
    }

    const shop = await Shop.findOne({ 'products._id': new mongoose.Types.ObjectId(id) });

    if (!shop) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    const product = shop.products.id(id);

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

/**
 * @route   GET /:shopId/products
 * @desc    Get all products for a given shop (public or customer-auth)
 * @access  Public
 * Example: GET /SHOP_ID/products
 */
app.get('/:shopId/products', async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found.' });
    }

    return res.status(200).json({
      msg: 'Shop products fetched successfully.',
      shopId: shop._id,
      shopName: shop.name,
      products: shop.products || [],
    });
  } catch (err) {
    console.error('Error fetching shop products:', err.message);
    return res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- Cloud Function Export ---
exports.get_product = app;
