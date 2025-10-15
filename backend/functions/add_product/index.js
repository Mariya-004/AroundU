const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const formidable = require('formidable');
const mongoose = require('mongoose');

// Adjust paths to go up one directory level to the common directories
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Middleware
app.use(cors({ origin: true }));
// We don't use express.json() because formidable handles the body parsing.

// --- Google Cloud Storage Configuration ---
const storage = new Storage();
// The bucket name is passed from your cloudbuild.yaml file
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

/**
 * Custom middleware to handle multipart/form-data using formidable.
 * This is necessary for file uploads.
 */
const formidableMiddleware = (req, res, next) => {
  const form = formidable({
    multiples: false,
    uploadDir: '/tmp', // Cloud Functions can only write to the /tmp directory
    maxFileSize: 5 * 1024 * 1024, // 5MB limit
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Formidable parsing error:', err);
      return res.status(400).json({ msg: 'Error processing form data.', error: err.message });
    }
    // Attach parsed fields and files to the request object
    req.body = fields;
    req.files = files;
    next();
  });
};

/**
 * @route   POST /
 * @desc    Add a new product with an image to the authenticated shopkeeper's shop
 * @access  Private (Requires shopkeeper role)
 */
app.post('/', auth, formidableMiddleware, async (req, res) => {
  await connectDB();

  try {
    // 1. Authorization: Check if the user is a shopkeeper
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
    }

    // 2. Extract product details and the uploaded file
    const { name, description, price, stock } = req.body;
    const imageFile = req.files.productImage; // 'productImage' must match the name attribute in your frontend form

    // 3. Validation
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Product name, price, and stock are required.' });
    }
    if (!imageFile) {
      return res.status(400).json({ msg: 'A product image is required.' });
    }

    // 4. Upload image to Google Cloud Storage
    const gcsFileName = `${req.user.id}-${Date.now()}-${imageFile.originalFilename}`;
    await bucket.upload(imageFile.filepath, {
      destination: gcsFileName,
      metadata: {
        contentType: imageFile.mimetype,
      },
    });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

    // 5. Find the shop belonging to the shopkeeper
    let shop = await Shop.findOne({ shopkeeperId: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found. Please create a shop profile first.' });
    }
    
    // 6. Create the new product object
    // Formidable can wrap fields in arrays, so we safely access the first element.
    const getField = f => (Array.isArray(f) ? f[0] : f);
    
    const newProduct = {
      name: getField(name),
      description: getField(description) || '',
      price: parseFloat(getField(price)),
      stock: parseInt(getField(stock), 10),
      imageUrl: publicUrl,
    };

    // 7. Push the product to the shop's products array and save
    shop.products.push(newProduct);
    await shop.save();

    const addedProduct = shop.products[shop.products.length - 1];

    res.status(201).json({
      msg: 'Product added successfully!',
      product: addedProduct,
    });

  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).send('Server error');
  }
});

exports.add_product = app;

