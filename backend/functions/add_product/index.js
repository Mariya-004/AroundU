const express = require('express');
const cors = require('cors');
// const { Storage } = require('@google-cloud/storage'); // Removed
// const formidable  = require('formidable'); // Removed
const mongoose = require('mongoose');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- CORS Configuration ---
const FRONTEND_URL = 'https://aroundu-frontend-164909903360.asia-south1.run.app';

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Add express.json() middleware to parse JSON request bodies
app.use(express.json());

// Handle OPTIONS preflight requests (can often be removed if `cors` is configured well)
app.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', FRONTEND_URL);
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send('');
});

// --- GCS Configuration (Removed) ---
// --- Formidable Middleware (Removed) ---

// --- POST / Add Product ---
// The formidableMiddleware has been removed from the middleware chain.
app.post('/', auth, async (req, res) => {
  try {
    await connectDB();

    // 1. Validate user role
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
    }

    // 2. Extract fields from the JSON body
    // req.body is now a JSON object, not form fields from formidable.
    const { name, description, price, stock } = req.body;

    // 3. Validate required fields
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Name, price, and stock are required.' });
    }

    // 4. Find or auto-create shop
    // Correct and much cleaner
    let shop = await Shop.findOne({ shopkeeperId: req.user.id });
    if (!shop) {
      shop = new Shop({
        shopkeeperId: mongoose.Types.ObjectId(req.user.id),
        name: 'My Shop',
        address: 'Default Address',
        location: { type: 'Point', coordinates: [0, 0] },
        products: [],
      });
      await shop.save();
    }

    // 5. Create new product object (without imageUrl)
    const newProduct = {
      name: name,
      description: description || '', // Set a default value if description is not provided
      price: parseFloat(price),
      stock: parseInt(stock, 10),
    };

    // 6. Save the new product
    shop.products.push(newProduct);
    await shop.save();

    return res.status(201).json({
      msg: 'Product added successfully!',
      newProduct: shop.products[shop.products.length - 1],
    });

  } catch (err) {
    console.error('Error in add_product endpoint:', err);
    return res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.add_product = app;