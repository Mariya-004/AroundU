const express = require('express');
const cors = require('cors');
const Busboy = require('busboy');
const { Storage } = require('@google-cloud/storage');
const util = require('util');
const { format } = util;

// Common modules
const connectDB = require('./common/db.js');
const Shop = require('./common-models/Shop.js'); // Adjusted path for clarity
const auth = require('./common/authMiddleware.js');

const app = express();
app.use(cors({ origin: true }));
// We do NOT use express.json() here, as it can interfere with busboy reading the stream.

// --- GCS Configuration ---
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);


// --- NEW PROMISE-BASED BUSBOY MIDDLEWARE ---
const processFormData = (req, res, next) => {
  const bb = Busboy({ headers: req.headers });

  const fields = {};
  const filePromises = [];

  bb.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  bb.on('file', (fieldname, file, GCSfile) => {
    if (fieldname === 'productImage') {
      const gcsFileName = `${Date.now()}_${GCSfile.filename}`;
      const blob = bucket.file(gcsFileName);
      const blobStream = blob.createWriteStream({ resumable: false });

      file.pipe(blobStream);

      const filePromise = new Promise((resolve, reject) => {
        blobStream.on('finish', () => {
          const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
          resolve({ fieldname, publicUrl });
        });
        blobStream.on('error', (err) => {
          reject(`File upload error: ${err}`);
        });
      });
      filePromises.push(filePromise);
    } else {
      file.resume();
    }
  });

  bb.on('finish', async () => {
    try {
      const files = await Promise.all(filePromises);
      // Attach fields and file data to the request object
      req.body = fields;
      req.files = files; // You can access the URL via req.files[0].publicUrl
      next();
    } catch (err) {
      next(err);
    }
  });

  bb.on('error', err => {
    next(err);
  });
  
  // End the stream if the request is closed prematurely
  req.on('close', () => {
    bb.destroy();
  });

  req.pipe(bb);
};


/**
 * @route   POST /
 * @desc    Add a new product.
 * @access  Private (Shopkeeper only)
 */
app.post('/', [auth, processFormData], async (req, res) => {
  try {
    // --- Business logic is now clean and simple ---
    await connectDB();

    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
    }
    
    // File URL comes from our new middleware
    const imageUrl = req.files && req.files.length > 0 ? req.files[0].publicUrl : null;
    if (!imageUrl) {
        return res.status(400).json({ msg: 'Product image is required.' });
    }

    const { name, description, price, stock } = req.body;
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Name, price, and stock are required fields.' });
    }
    
    const shop = await Shop.findOne({ shopkeeperId: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found for this user.' });
    }
    
    const newProduct = {
      name,
      description: description || '',
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      imageUrl: imageUrl,
    };
    
    shop.products.push(newProduct);
    await shop.save();

    res.status(201).json({
        msg: 'Product added successfully!',
        newProduct: shop.products[shop.products.length - 1]
    });

  } catch (err) {
    console.error("Error in add_product endpoint:", err);
    res.status(500).send('Server Error');
  }
});

exports.add_product = app;