const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const { IncomingForm } = require('formidable');
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

// Handle preflight requests
app.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', FRONTEND_URL);
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send('');
});

// --- GCS Configuration ---
const storage = new Storage();
const bucket = storage.bucket('aroundu-products');

// --- Formidable Middleware ---
const formidableMiddleware = (req, res, next) => {
  const form = new IncomingForm({
    uploadDir: '/tmp',           // serverless temp directory
    keepExtensions: true,
    multiples: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    fileWriteStreamHandler: null,
  });

  // Extend timeout (optional)
  form.timeout = 30000; // 30 seconds

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Formidable error:', err);
      return res.status(400).json({ msg: 'Invalid form submission', error: err.message });
    }

    // Attach parsed data
    req.body = fields;
    req.files = files;
    next();
  });
};

// --- POST / Add Product ---
app.post('/', [auth, formidableMiddleware], async (req, res) => {
  try {
    await connectDB();

    if (!req.user || req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
    }

    // Extract data safely
    const name = req.body.name;
    const description = req.body.description || '';
    const price = parseFloat(req.body.price);
    const stock = parseInt(req.body.stock, 10);
    const imageFile = req.files?.productImage;

    if (!imageFile) {
      return res.status(400).json({ msg: 'Product image is required.' });
    }
    if (!name || isNaN(price) || isNaN(stock)) {
      return res.status(400).json({ msg: 'Name, price, and stock are required and must be valid.' });
    }

    console.log('Uploading image:', imageFile.originalFilename);

    // Upload image to GCS
    const gcsFileName = `${Date.now()}_${imageFile.originalFilename}`;
    await bucket.upload(imageFile.filepath, { destination: gcsFileName });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

    // Find or create shop
    let shop = await Shop.findOne({ shopkeeperId: req.user.id });
    if (!shop) {
      shop = new Shop({
        shopkeeperId: req.user.id,
        name: 'My Shop',
        address: 'Default Address',
        location: { type: 'Point', coordinates: [0, 0] },
        products: [],
      });
    }

    const newProduct = {
      name,
      description,
      price,
      stock,
      imageUrl: publicUrl,
    };

    shop.products.push(newProduct);
    await shop.save();

    console.log('✅ Product added:', newProduct.name);

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
