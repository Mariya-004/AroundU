const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

// For file uploads
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express();

// ✅ Enable CORS only — NO express.json() (critical for multer)
app.use(cors({ origin: true }));
app.options('*', cors({ origin: true }));

// ✅ Multer setup for memory storage (no file system)
const multer_upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ✅ Google Cloud Storage instance (assumes proper permissions)
const storage = new Storage();

app.post('/', auth, (req, res, next) => {
  // Manually disable automatic body parsing for Cloud Functions
  req.rawBody = req.rawBody || req.body;
  next();
}, multer_upload.single('imageFile'), async (req, res) => {
  await connectDB();

  try {
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

    // ✅ Handle image upload (only if file exists)
    if (req.file) {
      const bucketName = 'aroundu-products'; // Ensure this bucket exists
      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(`${Date.now()}_${req.file.originalname}`);

      const blobStream = blob.createWriteStream({ resumable: false });

      await new Promise((resolve, reject) => {
        blobStream.on('finish', () => {
          uploadedImageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          resolve();
        });
        blobStream.on('error', (err) => {
          console.error('GCS upload error:', err);
          reject(err);
        });
        blobStream.end(req.file.buffer);
      });
    }

    // ✅ Save product to shop
    const { name, description, price, stock } = req.body;
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Missing product details' });
    }

    const newProduct = {
      name,
      description: description || '',
      price: Number(price),
      stock: Number(stock),
      imageUrl: uploadedImageUrl,
    };

    shop.products.push(newProduct);
    await shop.save();

    res.status(201).json({
      msg: 'Product added successfully',
      product: shop.products.at(-1),
    });
  } catch (err) {
    console.error('❌ Add Product Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

exports.add_product = app;
