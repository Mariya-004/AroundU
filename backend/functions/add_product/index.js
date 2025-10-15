const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const { formidable } = require('formidable');
const mongoose = require('mongoose');

// Common modules
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Enable CORS
app.use(cors({ origin: true }));

// --- Google Cloud Storage Configuration ---
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

/**
 * Middleware for handling multipart/form-data using formidable.
 */
const formidableMiddleware = (req, res, next) => {
  const form = formidable({
    multiples: false,
    uploadDir: '/tmp', // Cloud Functions can only write to /tmp
    maxFileSize: 5 * 1024 * 1024, // 5 MB limit
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Formidable parsing error:', err);
      return res.status(400).json({ msg: 'Error processing form data.', error: err.message });
    }
    req.body = fields;
    req.files = files;
    next();
  });
};

/**
 * POST /
 * Add a new product (with image) to the shopkeeper's shop.
 */
app.post('/', auth, formidableMiddleware, async (req, res) => {
  await connectDB();

  try {
    // 1. Verify user role
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
    }

    // 2. Extract product data
    const { name, description, price, stock } = req.body;
    const imageFile = req.files.productImage;

    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Product name, price, and stock are required.' });
    }
    if (!imageFile) {
      return res.status(400).json({ msg: 'Product image is required.' });
    }

    // 3. Upload image to GCS
    const gcsFileName = `${req.user.id}-${Date.now()}-${imageFile.originalFilename}`;
    console.log('Uploading file to GCS:', imageFile.filepath, '→', gcsFileName);

    await bucket.upload(imageFile.filepath, {
      destination: gcsFileName,
      metadata: { contentType: imageFile.mimetype },
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;
    console.log('✅ Upload complete:', publicUrl);

    // 4. Find or validate shop
    let shop = await Shop.findOne({ shopkeeperId: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found. Please create a shop profile first.' });
    }

    // 5. Create product
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
    console.error('Error adding product:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

exports.add_product = app;
