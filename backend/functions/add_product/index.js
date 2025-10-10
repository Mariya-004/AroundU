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
const storage = new Storage(); // Assumes authentication is handled by the environment
const multer_upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb
  },
});

// Important: Do NOT use express.json() for this multipart form route
app.use(cors({ origin: true }));
app.options('*', cors({ origin: true }));

// This route now handles both file upload and data saving
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

    // If a file was uploaded, handle it
    if (req.file) {
      const bucketName = 'aroundu-products'; // <-- IMPORTANT: REPLACE THIS
      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(Date.now() + "_" + req.file.originalname);
      
      const blobStream = blob.createWriteStream({
        resumable: false,
      });

      await new Promise((resolve, reject) => {
        blobStream.on('finish', () => {
          uploadedImageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          resolve();
        });
        blobStream.on('error', (err) => {
          reject('Unable to upload image, something went wrong');
        });
        blobStream.end(req.file.buffer);
      });
    }

    // Now, save the product details from the form fields
    const { name, description, price, stock } = req.body;
    const newProduct = { 
      name, 
      description, 
      price: Number(price), // Ensure price and stock are numbers
      stock: Number(stock), 
      imageUrl: uploadedImageUrl 
    };

    shop.products.push(newProduct);
    await shop.save();

    res.status(201).json(shop.products.slice(-1)[0]); // Return the newly added product
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



exports.add_product = app;