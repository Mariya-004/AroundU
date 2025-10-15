const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const formidable  = require('formidable');
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

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', FRONTEND_URL);
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send('');
});

// --- GCS Configuration ---
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// --- Formidable Middleware ---
const formidableMiddleware = (req, res, next) => {
  const form = formidable({
    uploadDir: '/tmp', // ✅ Cloud Functions can only write to /tmp
    maxFileSize: 5 * 1024 * 1024, // 5 MB limit
    multiples: false,
    keepExtensions: true,
  });

  let responded = false;

  // Timeout if form never finishes (increase to 60s for safety)
  const timeout = setTimeout(() => {
    if (!responded) {
      responded = true;
      console.error('Formidable timeout – sending 408');
      res.status(408).json({ msg: 'Request timeout while uploading file.' });
      form.emit('error', new Error('Form timeout'));
    }
  }, 60000); // 60s timeout to allow slow cold starts or uploads

  form.parse(req, (err, fields, files) => {
    if (responded) return;
    clearTimeout(timeout);

    if (err) {
      responded = true;
      console.error('Formidable error:', err);
      return res.status(400).json({ msg: 'Invalid form submission', error: err.message });
    }

    req.body = fields;
    req.files = files;
    responded = true;
    next();
  });
};

// --- POST / Add Product ---
app.post('/', [auth, formidableMiddleware], async (req, res) => {
  try {
    await connectDB();

    // 1. Validate user role
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
    }

    // 2. Extract fields and file
    const { name, description, price, stock } = req.body;
    let imageFile = req.files?.productImage;

    if (!imageFile) {
      return res.status(400).json({ msg: 'Product image is required.' });
    }

    // Handle single file (Formidable may wrap in array)
    imageFile = Array.isArray(imageFile) ? imageFile[0] : imageFile;

    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Name, price, and stock are required.' });
    }

    // 3. Upload to GCS
    const gcsFileName = `${Date.now()}_${imageFile.originalFilename}`;
    await bucket.upload(imageFile.filepath, {
      destination: gcsFileName,
    });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

    // 4. Find or auto-create shop
    let shop = await Shop.findOne({ shopkeeperId: mongoose.Types.ObjectId(req.user.id) });
    if (!shop) {
      shop = new Shop({
        shopkeeperId: mongoose.Types.ObjectId(req.user.id),
        name: 'My Shop',
        address: 'Default Address',
        location: { type: 'Point', coordinates: [0, 0] },
        products: [],
      });
      await shop.save();
    }

    // 5. Save new product
    const getField = f => Array.isArray(f) ? f[0] : f;
    const newProduct = {
      name: getField(name),
      description: description ? getField(description) : '',
      price: parseFloat(getField(price)),
      stock: parseInt(getField(stock), 10),
      imageUrl: publicUrl,
    };

    shop.products.push(newProduct);
    await shop.save();

    return res.status(201).json({
      msg: 'Product added successfully!',
      newProduct: shop.products[shop.products.length - 1],
    });

  } catch (err) {
    console.error('Error in add_product endpoint:', err);
    return res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.add_product = app;
