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

app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// This fixes the "Unexpected end of form" issue on GCF:
app.use(express.raw({ type: 'multipart/form-data', limit: '10mb' }));

// --- Ensure Upload Directory Exists ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Multer Setup ---
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// --- Endpoint ---
app.post('/', auth, upload.single('imageFile'), async (req, res) => {
  try {
    await connectDB();

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user || user.role !== 'shopkeeper')
      return res.status(403).json({ msg: 'Forbidden: Not a shopkeeper.' });

    const shop = await Shop.findOne({ shopkeeperId: userId });
    if (!shop) return res.status(404).json({ msg: 'Shop not found.' });

    const { name, description, price, stock } = req.body;
    if (!name || !price || !stock)
      return res.status(400).json({ msg: 'Missing required fields.' });

    const newProduct = {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
    };

    shop.products.push(newProduct);
    await shop.save();

    res.status(201).json({
      msg: 'Product added successfully.',
      product: shop.products.at(-1),
    });
  } catch (err) {
    console.error('🔥 Server error:', err);
    res.status(500).json({
      msg: 'Internal Server Error',
      error: err.message,
    });
  }
});

exports.add_product = app;
