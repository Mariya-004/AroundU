// add_product/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const util = require('util');
const { format } = util;

// Import your common modules
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- GCS & MULTER CONFIGURATION ---

const storage = new Storage(); // GCS client
const multer_upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// Get bucket name from environment variables
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// --- HELPER MIDDLEWARE for GCS UPLOAD ---
const uploadToGcs = (req, res, next) => {
    if (!req.file) return next();

    const blob = bucket.file(Date.now() + "_" + req.file.originalname);
    const blobStream = blob.createWriteStream({ resumable: false });

    blobStream.on('error', (err) => next(err));

    blobStream.on('finish', () => {
        const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
        req.file.gcsUrl = publicUrl; // Attach URL to request
        next();
    });

    blobStream.end(req.file.buffer);
};


/**
 * @route   POST /
 * @desc    Add a new product with an image.
 * @access  Private (Shopkeeper only)
 */
app.post('/', [auth, multer_upload.single('productImage'), uploadToGcs], async (req, res) => {
  await connectDB();

  try {
    // 1. Validate role and file
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
    }
    if (!req.file || !req.file.gcsUrl) {
      return res.status(400).json({ msg: 'Product image is required.' });
    }

    // 2. Validate product data
    const { name, description, price, stock } = req.body;
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Name, price, and stock are required fields.' });
    }

    // 3. Find shop and create product
    const shop = await Shop.findOne({ shopkeeperId: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found for this user.' });
    }

    const newProduct = {
      name,
      description: description || '',
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      imageUrl: req.file.gcsUrl // Use URL from our GCS middleware
    };

    // 4. Save and respond
    shop.products.push(newProduct);
    await shop.save();

    res.status(201).json({
        msg: 'Product added successfully!',
        newProduct: shop.products[shop.products.length - 1]
    });

  } catch (err) {
    console.error("Error in add_product:", err);
    res.status(500).send('Server Error');
  }
});

// Export the Express app for GCP
exports.add_product = app;