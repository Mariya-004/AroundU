const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');
const { Storage } = require('@google-cloud/storage');

// Note: We still need multer, but only to parse the form IN the function
// The Functions Framework will handle the initial request processing
const multer = require('multer');
const multer_parser = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // no larger than 5mb
    },
});

const app = express();
const storage = new Storage();

// Set up CORS
app.use(cors({ origin: true }));

// This is our main entry point
app.post('/', auth, multer_parser.single('imageFile'), async (req, res) => {
    
    // By the time this code runs, multer has already processed the request
    // and attached the file to req.file and text fields to req.body.
    
    try {
        await connectDB();

        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || user.role !== 'shopkeeper') {
            return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
        }

        const shop = await Shop.findOne({ shopkeeperId: userId });
        if (!shop) {
            return res.status(404).json({ msg: 'Shop not found for this shopkeeper.' });
        }

        // The text fields are now in req.body, thanks to multer
        const { name, description, price, stock } = req.body;
        let uploadedImageUrl = '';

        // The file is now in req.file
        if (req.file) {
            const bucketName = 'aroundu-products';
            const bucket = storage.bucket(bucketName);
            const blob = bucket.file(Date.now() + "_" + req.file.originalname);
            const blobStream = blob.createWriteStream({
                resumable: false,
                contentType: req.file.mimetype,
            });

            // We create a promise to wait for the upload to finish
            await new Promise((resolve, reject) => {
                blobStream.on('finish', () => {
                    uploadedImageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                    resolve();
                });
                blobStream.on('error', (err) => {
                    reject('Unable to upload image, something went wrong');
                });
                // Write the file's buffer to the GCS stream
                blobStream.end(req.file.buffer);
            });
        }

        const newProduct = {
            name,
            description,
            price: Number(price),
            stock: Number(stock),
            imageUrl: uploadedImageUrl
        };

        shop.products.push(newProduct);
        await shop.save();

        res.status(201).json(shop.products.slice(-1)[0]);

    } catch (err) {
        console.error("Error in function execution:", err);
        res.status(500).send('Server error');
    }
});

exports.add_product = app;