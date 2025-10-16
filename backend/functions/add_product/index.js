const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const { IncomingForm } = require('formidable'); // FIX 1: Correctly import IncomingForm
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
const bucket = storage.bucket(aroundu_products);

// --- Formidable Middleware ---
const formidableMiddleware = (req, res, next) => {
  const form = new IncomingForm({ // FIX 2: Instantiate with 'new'
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
    // IMPORTANT: Move this line to your main server file to be called only ONCE at startup.
    await connectDB();

    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
    }

    // FIX 3: Simplify field extraction with destructuring
    const { name: [name], description: [description], price: [price], stock: [stock] } = req.body;
    const imageFile = req.files.productImage?.[0];

    if (!imageFile) {
      return res.status(400).json({ msg: 'Product image is required.' });
    }
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Name, price, and stock are required.' });
    }

    const gcsFileName = `${Date.now()}_${imageFile.originalFilename}`;
    await bucket.upload(imageFile.filepath, { destination: gcsFileName });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

    // FIX 4: Let Mongoose handle ObjectId casting automatically
    let shop = await Shop.findOne({ shopkeeperId: req.user.id });
    
    if (!shop) {
      shop = new Shop({
        shopkeeperId: req.user.id,
        name: 'My Shop',
        address: 'Default Address',
        location: { type: 'Point', coordinates: [0, 0] },
        products: [],
      });
    }

    const newProduct = {
      name,
      description: description || '',
      price: parseFloat(price),
      stock: parseInt(stock, 10),
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