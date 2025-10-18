require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const { IncomingForm } = require('formidable');
const mongoose = require('mongoose');
const os = require('os');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- Database Connection ---
// This is called once when the function instance starts.
connectDB();

// --- CORS Configuration ---
// It's crucial that FRONTEND_URL is set in your environment variables.
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-default-frontend-url.com';
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- Google Cloud Storage Setup ---
const bucketName = process.env.GCS_BUCKET_NAME || 'aroundu-products';
const storage = new Storage();
const bucket = storage.bucket(bucketName);

// --- Formidable Middleware for File Uploads ---
const formidableMiddleware = (req, res, next) => {
    console.log('[FORMIDABLE] Middleware started.');
    const form = new IncomingForm({
        uploadDir: os.tmpdir(), // Use the OS's temporary directory
        maxFileSize: 5 * 1024 * 1024, // 5 MB
        keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('[FORMIDABLE] Error parsing form:', err);
            return res.status(400).json({ msg: 'Error parsing form data.', error: err.message });
        }
        console.log('[FORMIDABLE] Form parsed successfully.');
        req.files = files; // Attach parsed files to the request object
        next();
    });
};

// --- API Endpoint ---
app.patch('/shops/:shopId/products/:productId/image', [auth, formidableMiddleware], async (req, res) => {
    try {
        console.log('[1] Handler triggered. Finding shop...');
        const shop = await Shop.findById(req.params.shopId);

        if (!shop) {
            console.warn('[WARN] Shop not found for ID:', req.params.shopId);
            return res.status(404).json({ msg: 'Shop not found.' });
        }
        console.log('[2] Shop found. Verifying owner...');

        if (shop.shopkeeperId.toString() !== req.user.id) {
            console.warn('[WARN] Authorization denied. Shop owner is', shop.shopkeeperId, 'but user is', req.user.id);
            return res.status(403).json({ msg: 'Authorization denied. You do not own this shop.' });
        }

        const imageFile = req.files.productImage?.[0];
        if (!imageFile) {
            console.warn('[WARN] No image file was uploaded.');
            return res.status(400).json({ msg: 'Product image file is required.' });
        }

        const product = shop.products.id(req.params.productId);
        if (!product) {
            console.warn('[WARN] Product not found for ID:', req.params.productId);
            return res.status(404).json({ msg: 'Product not found within this shop.' });
        }
        console.log('[3] Product found. Starting Google Cloud Storage upload...');

        const gcsFileName = `products/${product._id}_${Date.now()}_${imageFile.originalFilename}`;
        await bucket.upload(imageFile.filepath, {
            destination: gcsFileName,
        });
        console.log('[4] GCS upload complete. Constructing public URL...');

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

        product.imageUrl = publicUrl;
        console.log('[5] Saving updated product info to the database...');
        await shop.save();
        console.log('[6] Database save complete. Sending success response.');

        res.status(200).json({
            msg: 'Product image updated successfully!',
            product: product
        });

    } catch (err) {
        console.error('--- [FATAL] UNHANDLED ERROR in image update handler ---');
        console.error(err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

exports.updateProductImage = app;