const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

const app = express();
const storage = new Storage();

// CORS
app.use(cors({ origin: true }));
app.options('*', cors({ origin: true }));

// Configure Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 👇 Wrapper function to safely handle stream endings
function safeMulter(handler) {
  return (req, res) => {
    upload.single('imageFile')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ msg: 'File upload failed', error: err.message });
      }
      return handler(req, res);
    });
  };
}

// Main endpoint
app.post('/', auth, safeMulter(async (req, res) => {
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

    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.originalname : 'No file received');

    let uploadedImageUrl = '';

    if (req.file) {
      const bucketName = 'aroundu-products';
      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(`${Date.now()}_${req.file.originalname}`);

      await new Promise((resolve, reject) => {
        const blobStream = blob.createWriteStream({
          resumable: false,
          contentType: req.file.mimetype,
        });

        blobStream.on('finish', () => {
          uploadedImageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          resolve();
        });

        blobStream.on('error', (err) => {
          console.error('Upload error:', err);
          reject('Unable to upload image');
        });

        blobStream.end(req.file.buffer);
      });
    }

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
}));

exports.add_product = app;
