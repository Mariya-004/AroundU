/**
 * Google Cloud Function: add_product
 * Handles product creation by authenticated shopkeepers.
 * Uses multer for local uploads and MongoDB for storage.
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- Middleware ---
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Ensure Upload Directory Exists ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter
});

// --- Main Endpoint ---
app.post('/', auth, upload.single('imageFile'), async (req, res) => {
  try {
    // Connect to DB (cached connection)
    await connectDB();

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized: Missing user ID' });

    const user = await User.findById(userId);
    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
    }

    const shop = await Shop.findOne({ shopkeeperId: userId });
    if (!shop) return res.status(404).json({ msg: 'Shop not found for this shopkeeper.' });

    const { name, description, price, stock } = req.body;

    // Basic input validation
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Missing required fields: name, price, stock.' });
    }

    const newProduct = {
      name: name.trim(),
      description: description?.trim() || '',
      price: Number(price),
      stock: Number(stock),
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '', // public path (for local dev)
    };

    shop.products.push(newProduct);
    await shop.save();

    const createdProduct = shop.products[shop.products.length - 1];

    return res.status(201).json({
      msg: 'Product added successfully.',
      product: createdProduct,
    });
  } catch (err) {
    console.error('Error adding product:', err);
    return res.status(500).json({
      msg: 'Internal Server Error',
      error: err.message,
    });
  }
});

// --- Export for Google Cloud Function ---
exports.add_product = app;
