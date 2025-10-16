const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage'); // Restored
const formidable  = require('formidable'); // Restored
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

// Note: express.json() is not needed for this multipart route, but can be kept for other routes.

// --- GCS Configuration (Restored) ---
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// --- Formidable Middleware (Restored) ---
const formidableMiddleware = (req, res, next) => {
  const form = formidable({
    uploadDir: '/tmp', // Use /tmp for serverless environments
    maxFileSize: 5 * 1024 * 1024, // 5MB
    multiples: false,
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Formidable error:', err);
      return res.status(400).json({ msg: 'Invalid form submission', error: err.message });
    }
    req.body = fields; // Attach text fields to req.body
    req.files = files; // Attach files to req.files
    next();
  });
};

// --- POST / Add Product ---
app.post('/', [auth, formidableMiddleware], async (req, res) => {
  try {
    await connectDB();

    // 1. Validate user role
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
    }

    // 2. Extract fields and file from the parsed form
    // Formidable returns all fields as arrays.
    const { name: [name], description: [description], price: [price], stock: [stock] } = req.body;
    const imageFile = req.files.productImage?.[0]; // Get the first file from the productImage field

    // 3. Validate input
    if (!imageFile) {
      return res.status(400).json({ msg: 'Product image is required.' });
    }
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Name, price, and stock are required.' });
    }

    // 4. Upload image to GCS
    const gcsFileName = `${Date.now()}_${imageFile.originalFilename}`;
    await bucket.upload(imageFile.filepath, {
      destination: gcsFileName,
    });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

    // 5. Find or auto-create shop
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

    // 6. Create new product object with the image URL
    const newProduct = {
      name: name,
      description: description || '',
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      imageUrl: publicUrl, // Add the GCS public URL
    };

    // 7. Save the new product
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