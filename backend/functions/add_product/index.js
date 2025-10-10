const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express();

// ✅ Manually define allowed origins
const allowedOrigins = [
  'https://aroundu-frontend-164909903360.asia-south1.run.app', // your frontend
];

// ✅ CORS middleware for all requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).send(''); // ✅ Preflight response
  }

  next();
});

const storage = new Storage();
const multer_upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post('/', auth, multer_upload.single('imageFile'), async (req, res) => {
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

    if (req.file) {
      const bucketName = 'your-gcs-bucket-name'; // 🔧 Replace this
      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(Date.now() + '_' + req.file.originalname);

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
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ⚠️ DO NOT start a local server when deploying to Cloud Functions
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`Server running on ${PORT}`));

// ✅ Export for Cloud Function
exports.add_product = app;
