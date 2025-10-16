const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const formidable = require('formidable');
const mongoose = require('mongoose');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- CORS Configuration ---
const FRONTEND_URL = 'https://aroundu-frontend-164909903360.asia-south1.run.app';
app.use(cors({ origin: FRONTEND_URL }));

// --- GCS Configuration ---
const storage = new Storage();
const bucket = storage.bucket('aroundu-products'); // ✅ use bucket name only (not link)

// --- Formidable Middleware ---
const formidableMiddleware = (req, res, next) => {
  const form = formidable({
    uploadDir: '/tmp', // Cloud Function writable directory
    maxFileSize: 5 * 1024 * 1024, // 5MB
    multiples: false,
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Formidable error:', err);
      return res.status(400).json({ msg: 'Invalid form submission', error: err.message });
    }

    req.body = fields;
    req.files = files;
    next();
  });
};

// --- POST / Add Product ---
app.post('/', [auth, formidableMiddleware], async (req, res) => {
  try {
    await connectDB();

    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Requires shopkeeper role.' });
    }

    // Handle fields
    const name = req.body.name?.[0] || req.body.name;
    const description = req.body.description?.[0] || req.body.description;
    const price = parseFloat(req.body.price?.[0] || req.body.price);
    const stock = parseInt(req.body.stock?.[0] || req.body.stock, 10);
    const imageFile = req.files.productImage?.[0] || req.files.productImage;

    if (!name || !price || !stock || !imageFile) {
      return res.status(400).json({ msg: 'Missing required fields or image.' });
    }

    // Upload to GCS
    const gcsFileName = `${Date.now()}_${imageFile.originalFilename}`;
    await bucket.upload(imageFile.filepath, {
      destination: gcsFileName,
      metadata: { contentType: imageFile.mimetype },
    });

    // Make file public
    await bucket.file(gcsFileName).makePublic();
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

    // Add new product
    const newProduct = {
      name,
      description: description || '',
      price,
      stock,
      imageUrl: publicUrl,
    };

    shop.products.push(newProduct);
    await shop.save();

    return res.status(201).json({
      msg: '✅ Product added successfully!',
      newProduct,
    });
  } catch (err) {
    console.error('🔥 Server error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

exports.add_product = app;
