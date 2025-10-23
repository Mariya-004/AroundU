require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// --- CRITICAL: Import common files from the copied 'common' folder ---
// The cloudbuild.yaml file copies 'common' inside this directory
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js'); // Assuming User model is needed for auth check
const auth = require('./common/authMiddleware.js');

const app = express();

// --- Database Connection ---
connectDB();

// --- CORS Configuration ---
const allowedOrigins = [
    'https://aroundu-frontend-164909903360.asia-south1.run.app',
    'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy does not allow access from this origin.'));
    }
  },
  methods: ['GET', 'OPTIONS'], // Only GET and OPTIONS are needed for this API
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * @route   GET /
 * @desc    Get all products for the authenticated shopkeeper
 * @access  Private (Shopkeeper)
 */
app.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
    }

    const shop = await Shop.findOne({ shopkeeperId: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop profile not found. Please create one.' });
    }

    res.status(200).json({
      msg: 'Products fetched successfully',
      shopName: shop.name,
      shopId: shop._id,
      products: shop.products || [],
    });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).send('Server Error');
  }
});

// This must match the --entry-point in your cloudbuild.yaml
exports.shop_products = app;

