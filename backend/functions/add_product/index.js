const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const formidable = require('formidable'); // ✅ Correct import for v3+
const mongoose = require('mongoose');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- CORS Configuration ---
const FRONTEND_URL = 'https://aroundu-frontend-164909903360.asia-south1.run.app';
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- GCS Configuration ---
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// --- Formidable Middleware ---
const formidableMiddleware = (req, res, next) => {
  const form = formidable({
    uploadDir: '/tmp',
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
      return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
    }

    const { name, description, price, stock } = req.body;
    const imageFile = req.files.productImage;

    if (!imageFile) {
      return res.status(400).json({ msg: 'Product image is required.' });
    }
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Name, price, and stock are required.' });
    }

    const file = Array.isArray(imageFile) ? imageFile[0] : imageFile;
    const gcsFileName = `${Date.now()}_${file.originalFilename}`;
    await bucket.upload(file.filepath, { destination: gcsFileName });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

    let shop = await Shop.findOne({ shopkeeperId: mongoose.Types.ObjectId(req.user.id) });
    if (!shop) {
      shop = new Shop({
        shopkeeperId: mongoose.Types.ObjectId(req.user.id),
        name: 'My Shop',
        address: 'Default Address',
        location: { type: 'Point', coordinates: [0, 0] },
        products: [],
      });
    }

    const newProduct = {
      name: Array.isArray(name) ? name[0] : name,
      description: Array.isArray(description) ? description[0] : description || '',
      price: parseFloat(Array.isArray(price) ? price[0] : price),
      stock: parseInt(Array.isArray(stock) ? stock[0] : stock, 10),
      imageUrl: publicUrl,
    };

    shop.products.push(newProduct);
    await shop.save();

    res.status(201).json({
      msg: 'Product added successfully!',
      newProduct: shop.products.at(-1),
    });

  } catch (err) {
    console.error('Error in add_product endpoint:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.add_product = app;
