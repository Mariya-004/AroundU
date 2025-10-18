require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
// No longer need: const { IncomingForm } = require('formidable');
// No longer need: const os = require('os');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();
connectDB();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-default-frontend-url.com';
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const bucketName = process.env.GCS_BUCKET_NAME || 'aroundu-products';
const storage = new Storage();
const bucket = storage.bucket(bucketName);

// The 'formidableMiddleware' has been completely removed.
// We now only use the 'auth' middleware in the route.
app.patch('/shops/:shopId/products/:productId/image', [auth], async (req, res) => {
    try {
        console.log('[1] Handler triggered. Finding shop...');
        const shop = await Shop.findById(req.params.shopId);

        if (!shop) {
            return res.status(404).json({ msg: 'Shop not found.' });
        }
        console.log('[2] Shop found. Verifying owner...');

        if (shop.shopkeeperId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Authorization denied. You do not own this shop.' });
        }

        const product = shop.products.id(req.params.productId);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found within this shop.' });
        }
        
        // The file is now directly available in req.files from the native parser.
        // The structure might be slightly different. Let's log it to be sure.
        console.log('Received files:', req.files); 
        const imageFile = req.files.productImage; // It might not be an array now

        if (!imageFile) {
            return res.status(400).json({ msg: 'Product image file is required.' });
        }
        console.log('[3] Product found. Starting Google Cloud Storage upload...');
        
        // IMPORTANT: The property names from the native parser are different.
        // It's `imageFile.path` and `imageFile.originalname`
        const gcsFileName = `products/${product._id}_${Date.now()}_${imageFile.originalname}`;
        
        await bucket.upload(imageFile.path, {
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