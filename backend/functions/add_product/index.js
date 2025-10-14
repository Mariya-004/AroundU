const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const { formidable } = require('formidable'); // <-- Import formidable

// Common modules
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();
app.use(cors({ origin: true }));

// --- GCS Configuration ---
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);


// --- FORMIDABLE MIDDLEWARE ---
const formidableMiddleware = (req, res, next) => {
  const form = formidable({});

  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }
    // Attach parsed fields and files to the request object
    req.body = fields;
    req.files = files;
    next();
  });
};

/**
 * @route   POST /
 * @desc    Add a new product with an image.
 * @access  Private (Requires shopkeeper role)
 */
app.post('/', [auth, formidableMiddleware], async (req, res) => {
  try {
    await connectDB();

    // 1. Validate user role
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
    }

    // 2. Get file and fields from the formidable middleware
    const { name, description, price, stock } = req.body;
    const imageFile = req.files.productImage; // Formidable uses the field name as the key

    // 3. Validate input
    if (!imageFile || !imageFile[0]) {
      return res.status(400).json({ msg: 'Product image is required.' });
    }
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Name, price, and stock are required fields.' });
    }

    // 4. Upload file to GCS
    const uploadedFile = imageFile[0];
    const gcsFileName = `${Date.now()}_${uploadedFile.originalFilename}`;
    
    await bucket.upload(uploadedFile.filepath, {
        destination: gcsFileName,
    });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

    // 5. Find shop and save the new product
    const shop = await Shop.findOne({ shopkeeperId: req.user.id });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found for this user.' });
    }
    
    const newProduct = {
      name: name[0], // Formidable wraps fields in arrays
      description: description ? description[0] : '',
      price: parseFloat(price[0]),
      stock: parseInt(stock[0], 10),
      imageUrl: publicUrl,
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