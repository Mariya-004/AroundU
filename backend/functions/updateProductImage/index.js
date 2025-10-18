require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const Busboy = require('busboy'); // ✅ revert to plain require
const path = require('path');
const os = require('os');
const fs = require('fs');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();
connectDB();

// --- Configuration ---
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-default-frontend-url.com';
app.use(cors({ origin: FRONTEND_URL }));

const bucketName = process.env.GCS_BUCKET_NAME || 'aroundu-products';
const storage = new Storage();
const bucket = storage.bucket(bucketName);

// --- Busboy file upload middleware ---
const fileUploadMiddleware = (req, res, next) => {
  try {
    const busboy = Busboy({ headers: req.headers }); // ✅ FIXED (no "new")
    const tmpdir = os.tmpdir();
    const fileWrites = [];
    req.files = {};
    req.body = {};

    busboy.on('field', (fieldname, val) => {
      req.body[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, { filename }) => {
      if (!filename) return;
      console.log(`[Upload] Processing file: ${filename}`);
      const filepath = path.join(tmpdir, filename);
      const writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);

      const promise = new Promise((resolve, reject) => {
        file.on('end', () => writeStream.end());
        writeStream.on('finish', () => {
          console.log(`[Upload] File write finished: ${filename}`);
          req.files[fieldname] = { filepath, filename };
          resolve();
        });
        writeStream.on('error', reject);
      });
      fileWrites.push(promise);
    });

    busboy.on('finish', async () => {
      try {
        await Promise.all(fileWrites);
        console.log('[Upload] All files processed successfully.');
        next();
      } catch (err) {
        console.error('[Upload] Error writing files:', err);
        next(err);
      }
    });

    busboy.on('error', (err) => {
      console.error('[Upload] Busboy error:', err);
      next(err);
    });

    req.pipe(busboy);
  } catch (err) {
    console.error('[Upload] Middleware error:', err);
    next(err);
  }
};

// --- Route: update product image ---
app.patch('/shops/:shopId/products/:productId/image', [auth, fileUploadMiddleware], async (req, res) => {
  try {
    console.log('[1] Handler triggered. Finding shop...');
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ msg: 'Shop not found.' });

    console.log('[2] Shop found. Verifying owner...');
    if (shop.shopkeeperId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Authorization denied.' });
    }

    const imageFile = req.files.productImage;
    if (!imageFile) return res.status(400).json({ msg: 'Product image file is required.' });

    const product = shop.products.id(req.params.productId);
    if (!product) return res.status(404).json({ msg: 'Product not found.' });

    console.log('[3] Product found. Starting GCS upload...');
    const gcsFileName = `products/${product._id}_${Date.now()}${path.extname(imageFile.filename)}`;
    await bucket.upload(imageFile.filepath, { destination: gcsFileName });
    console.log('[4] GCS upload complete.');

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;
    product.imageUrl = publicUrl;

    console.log('[5] Saving updated product...');
    await shop.save();

    await fs.promises.unlink(imageFile.filepath).catch(console.warn);
    console.log('[6] Update complete.');

    res.status(200).json({
      msg: 'Product image updated successfully!',
      product,
    });
  } catch (err) {
    console.error('[FATAL] Unhandled error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.updateProductImage = app;
