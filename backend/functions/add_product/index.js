// add_product.js

const express = require('express');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express();
const storage = new Storage();
const bucketName = 'your-gcs-bucket-name'; // 🔧 Replace this

// ✅ CORS setup for frontend + local dev
const allowedOrigins = [
  'https://aroundu-frontend-164909903360.asia-south1.run.app',
  'http://localhost:5173',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  next();
});

const multer_upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// ✅ Main route
app.post('/', auth, multer_upload.single('imageFile'), async (req, res) => {
  try {
    await connectDB();

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
    }

    const shop = await Shop.findOne({ shopkeeperId: userId });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found for this shopkeeper.' });
    }

    let uploadedImageUrl = '';

    // ✅ Handle image upload to GCS
    if (req.file) {
      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(`${Date.now()}_${req.file.originalname}`);
      const blobStream = blob.createWriteStream({ resumable: false });

      await new Promise((resolve, reject) => {
        blobStream.on('finish', () => {
          uploadedImageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          resolve();
        });
        blobStream.on('error', (err) => reject(err));
        blobStream.end(req.file.buffer);
      });
    }

    // ✅ Save product details
    const { name, description, price, stock } = req.body;
    const newProduct = {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      imageUrl: uploadedImageUrl,
    };

    shop.products.push(newProduct);
    await shop.save();

    res.status(201).json(shop.products.slice(-1)[0]);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ✅ Important: DO NOT start a server with app.listen()
exports.add_product = app;
