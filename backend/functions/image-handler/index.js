require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();
connectDB();

// --- CORS Configuration ---
// This list includes your deployed frontend AND your local development environment.
const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://aroundu-frontend-164909903360.asia-south1.run.app',
    'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Middleware to parse JSON request bodies
app.use(express.json());

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'aroundu-products';
const bucket = storage.bucket(bucketName);

// --- ENDPOINT 1: GENERATE THE SECURE UPLOAD URL ---
app.post('/shops/:shopId/products/:productId/generate-upload-url', auth, async (req, res) => {
    try {
        const { shopId, productId } = req.params;
        const { fileType } = req.body;

        if (!fileType) {
            return res.status(400).json({ msg: 'fileType (e.g., "image/jpeg") is required.' });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ msg: 'Shop not found.' });
        if (shop.shopkeeperId.toString() !== req.user.id) return res.status(403).json({ msg: 'Authorization denied.' });
        const product = shop.products.id(productId);
        if (!product) return res.status(404).json({ msg: 'Product not found.' });

        const fileExtension = fileType.split('/')[1];
        const gcsFileName = `products/${product._id}_${Date.now()}.${fileExtension}`;

        const options = {
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: fileType,
        };

        const [uploadUrl] = await bucket.file(gcsFileName).getSignedUrl(options);
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;

        res.status(200).json({ uploadUrl, publicUrl });

    } catch (err) {
        console.error('Error generating signed URL:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// --- ENDPOINT 2: SAVE THE FINAL URL TO THE DATABASE ---
app.patch('/shops/:shopId/products/:productId/save-image-url', auth, async (req, res) => {
    try {
        const { shopId, productId } = req.params;
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ msg: 'imageUrl is required.' });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ msg: 'Shop not found.' });
        if (shop.shopkeeperId.toString() !== req.user.id) return res.status(403).json({ msg: 'Authorization denied.' });
        
        const product = shop.products.id(productId);
        if (!product) return res.status(404).json({ msg: 'Product not found.' });

        product.imageUrl = imageUrl;
        await shop.save();

        res.status(200).json({ msg: 'Product image URL updated successfully!', product });

    } catch (err) {
        console.error('Error updating image URL:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// This must match the --entry-point in your cloudbuild.yaml
exports.handleImageUpload = app;

