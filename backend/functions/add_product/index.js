const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const { formidable } = require('formidable');
const mongoose = require('mongoose');

// --- Assume common modules are two levels up from the function directory ---
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- CORS Configuration ---
const FRONTEND_URL = 'https://aroundu-frontend-164909903360.asia-south1.run.app';
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- OPTIMIZATION: Connect to Database on Cold Start ---
// This promise is created once when the function instance starts.
const dbConnectionPromise = connectDB().catch(err => {
  console.error('FATAL: Failed to connect to MongoDB on initial load', err);
  process.exit(1); // Exit if the DB can't connect on startup
});

// --- GCS Configuration ---
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
if (!GCS_BUCKET_NAME) {
  throw new Error("FATAL ERROR: GCS_BUCKET_NAME environment variable is not set.");
}
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET_NAME);

// --- Formidable Middleware ---
const formidableMiddleware = (req, res, next) => {
  const form = formidable({
    multiples: false,
    uploadDir: '/tmp',
    maxFileSize: 5 * 1024 * 1024,
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({ msg: 'Error processing form data.', error: err.message });
    }
    req.body = fields;
    req.files = files;
    next();
  });
};

/**
 * @route   POST /
 * @desc    Add a new product with an image to the shopkeeper's shop
 * @access  Private
 */
app.post('/', auth, formidableMiddleware, async (req, res) => {
  try {
    // Ensure the initial DB connection is ready before proceeding.
    await dbConnectionPromise;

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
    }

    const { name, description, price, stock } = req.body;
    const imageFile = req.files.productImage;

    if (!name || !price || !stock || !imageFile) {
      return res.status(400).json({ msg: 'Product name, price, stock, and an image are required.' });
    }

    const gcsFileName = `${req.user.id}-${Date.now()}-${imageFile.originalFilename}`;
    await bucket.upload(imageFile.filepath, {
      destination: gcsFileName,
      metadata: { contentType: imageFile.mimetype },
    });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

    let shop = await Shop.findOne({ shopkeeperId: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found. Please create a shop profile first.' });
    }

    const getField = f => (Array.isArray(f) ? f[0] : f);
    const newProduct = {
      name: getField(name),
      description: getField(description) || '',
      price: parseFloat(getField(price)),
      stock: parseInt(getField(stock), 10),
      imageUrl: publicUrl,
    };

    shop.products.push(newProduct);
    await shop.save();
    
    const addedProduct = shop.products[shop.products.length - 1];

    res.status(201).json({
      msg: 'Product added successfully!',
      product: addedProduct,
    });

  } catch (err) {
    console.error("Error adding product:", { message: err.message });
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

exports.add_product = app;

