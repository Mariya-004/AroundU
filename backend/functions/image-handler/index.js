require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();
connectDB();

// Middleware to parse JSON request bodies, which is all this function will handle.
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'aroundu-products';
const bucket = storage.bucket(bucketName);

// --- ENDPOINT 1: GENERATE THE SECURE UPLOAD URL ---
// The client (Postman or your frontend) calls this first to get permission to upload.
app.post('/shops/:shopId/products/:productId/generate-upload-url', auth, async (req, res) => {
    try {
        const { shopId, productId } = req.params;
        const { fileType } = req.body; // e.g., "image/jpeg" or "image/png"

        if (!fileType) {
            return res.status(400).json({ msg: 'fileType (e.g., "image/jpeg") is required.' });
        }

        // Authorization: Check if the user owns this shop and the product exists
        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ msg: 'Shop not found.' });
        if (shop.shopkeeperId.toString() !== req.user.id) return res.status(403).json({ msg: 'Authorization denied.' });
        const product = shop.products.id(productId);
        if (!product) return res.status(404).json({ msg: 'Product not found.' });

        // Define the file's future location and name in the bucket
        const fileExtension = fileType.split('/')[1];
        const gcsFileName = `products/${product._id}_${Date.now()}.${fileExtension}`;

        // Configure the Signed URL for a PUT request
        const options = {
            version: 'v4',
            action: 'write', // We are allowing the client to UPLOAD (write) a file
            expires: Date.now() + 15 * 60 * 1000, // The URL will be valid for 15 minutes
            contentType: fileType,
        };

        // Ask Google Cloud Storage to generate the special, one-time upload URL
        const [uploadUrl] = await bucket.file(gcsFileName).getSignedUrl(options);

        // This is the final public URL that you will save to your database later
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;

        // Send both URLs back to the client
        res.status(200).json({ uploadUrl, publicUrl });

    } catch (err) {
        console.error('Error generating signed URL:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// --- ENDPOINT 2: SAVE THE FINAL URL TO THE DATABASE ---
// After the client finishes uploading the file directly to GCS, it calls this simple endpoint.
app.patch('/shops/:shopId/products/:productId/save-image-url', auth, async (req, res) => {
    try {
        const { shopId, productId } = req.params;
        const { imageUrl } = req.body; // The client sends the 'publicUrl' from the previous step

        if (!imageUrl) {
            return res.status(400).json({ msg: 'imageUrl is required.' });
        }

        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ msg: 'Shop not found.' });
        if (shop.shopkeeperId.toString() !== req.user.id) return res.status(403).json({ msg: 'Authorization denied.' });
        
        const product = shop.products.id(productId);
        if (!product) return res.status(404).json({ msg: 'Product not found.' });

        // Update the product's imageUrl in the database and save
        product.imageUrl = imageUrl;
        await shop.save();

        res.status(200).json({ msg: 'Product image URL updated successfully!', product });

    } catch (err) {
        console.error('Error updating image URL:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

exports.handleImageUpload = app;

