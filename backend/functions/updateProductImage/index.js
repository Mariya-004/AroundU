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

connectDB();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://aroundu-frontend-164909903360.asia-south1.run.app';
app.use(cors({ origin: FRONTEND_URL }));

const bucketName = process.env.GCS_BUCKET_NAME || 'aroundu-products';
const storage = new Storage();
const bucket = storage.bucket(bucketName);

const formidableMiddleware = (req, res, next) => {
    const form = new IncomingForm({
        uploadDir: os.tmpdir(),
        maxFileSize: 5 * 1024 * 1024,
        keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Formidable Error:', err);
            return res.status(400).json({ msg: 'Error parsing form data.', error: err.message });
        }
        req.files = files;
        next();
    });
};

app.patch('/shops/:shopId/products/:productId/image', [auth, formidableMiddleware], async (req, res) => {
    try {
        console.log('[1] Handler triggered. Finding shop...');
        const shop = await Shop.findById(req.params.shopId);

        if (!shop) {
            return res.status(404).json({ msg: 'Shop not found.' });
        }
        console.log('[2] Shop found. Verifying owner and finding product...');

        if (shop.shopkeeperId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Authorization denied. You do not own this shop.' });
        }

        const imageFile = req.files.productImage?.[0];
        if (!imageFile) {
            return res.status(400).json({ msg: 'Product image file is required.' });
        }

        const product = shop.products.id(req.params.productId);
        if (!product) {
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
        console.error('Error updating product image:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

exports.updateProductImage = app;


