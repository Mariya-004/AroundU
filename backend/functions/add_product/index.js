const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// --- CORS Setup ---
app.use(cors({ origin: true }));
app.options('*', cors({ origin: true }));

// --- Configure Multer for Local Disk Storage ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir); // Create the 'uploads' directory if it doesn't exist
}

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Save files to the 'uploads' folder
  },
  filename: function (req, file, cb) {
    // Create a unique filename to prevent overwriting
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage: diskStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// --- Main Endpoint ---
app.post('/', auth, upload.single('imageFile'), async (req, res) => {
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
    if (req.file) {
      // For local testing, this path is correct. For production, you'd use a public URL.
      uploadedImageUrl = req.file.path; 
      console.log('File saved locally to:', uploadedImageUrl);
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
});


// --- This export is what Google Cloud Functions uses ---
exports.add_product = app;