const express = require('express');
const cors = require('cors');
const Busboy = require('busboy'); // <-- Use Busboy
const { Storage } = require('@google-cloud/storage');
const util = require('util');
const { format } = util;

// Common modules
const connectDB = require('../common/db.js');
const Shop = require('../common/models/Shop.js');
const auth = require('../common/authMiddleware.js');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- GCS Configuration ---
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);


/**
 * @route   POST /
 * @desc    Add a new product with an image.
 * @access  Private (Shopkeeper only)
 */
app.post('/', auth, async (req, res) => {
  // Use Busboy to handle the multipart/form-data stream
  const bb = Busboy({ headers: req.headers });
  
  // These will hold the fields and the file promise
  const fields = {};
  let fileUploadPromise;

  bb.on('field', (fieldname, val) => {
    // Collect all text fields
    fields[fieldname] = val;
  });

  bb.on('file', (fieldname, file, GCSfile) => {
    // Check if the fieldname is the one we expect
    if (fieldname === 'productImage') {
      const gcsFileName = `${Date.now()}_${GCSfile.filename}`;
      const blob = bucket.file(gcsFileName);
      const blobStream = blob.createWriteStream({ resumable: false });

      file.pipe(blobStream);

      // Create a promise that resolves when the file is finished uploading
      fileUploadPromise = new Promise((resolve, reject) => {
        blobStream.on('finish', () => {
          const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
          resolve(publicUrl);
        });
        blobStream.on('error', reject);
      });
    } else {
      // If it's not the correct file field, just drain the stream
      file.resume();
    }
  });

  bb.on('finish', async () => {
    try {
      if (!fileUploadPromise) {
        return res.status(400).json({ msg: 'Product image is required.' });
      }

      // Wait for the file upload to complete
      const imageUrl = await fileUploadPromise;

      // Now connect to DB and perform logic
      await connectDB();

      if (req.user.role !== 'shopkeeper') {
        return res.status(403).json({ msg: 'Forbidden: Action requires shopkeeper role.' });
      }

      const { name, description, price, stock } = fields;
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
        imageUrl: imageUrl, // URL from the resolved promise
      };
      
      shop.products.push(newProduct);
      await shop.save();

      res.status(201).json({
          msg: 'Product added successfully!',
          newProduct: shop.products[shop.products.length - 1]
      });

    } catch (err) {
      console.error("Error processing request:", err);
      res.status(500).send('Server Error');
    }
  });

  // Pipe the request into busboy
  req.pipe(bb);
});

// Export the Express app for GCP
exports.add_product = app;