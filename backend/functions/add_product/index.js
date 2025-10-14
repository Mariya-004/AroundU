const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Busboy = require('busboy');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Ensure Upload Directory Exists ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- POST /  Add Product ---
app.post('/', auth, async (req, res) => {
  try {
    await connectDB();

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user || user.role !== 'shopkeeper')
      return res.status(403).json({ msg: 'Forbidden: Not a shopkeeper.' });

    // --- Convert userId string to ObjectId for MongoDB query ---
    const objectUserId = mongoose.Types.ObjectId(userId);

    // --- Find or create shop ---
    let shop = await Shop.findOne({ shopkeeperId: objectUserId });
    if (!shop) {
      // Auto-create shop with default values
      shop = new Shop({
        shopkeeperId: objectUserId,
        name: 'My Shop',
        address: 'Default Address',
        location: { type: 'Point', coordinates: [0, 0] },
        products: []
      });
      await shop.save();
    }

    // --- Parse multipart/form-data using Busboy ---
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    let uploadedFilePath = '';

    busboy.on('file', (fieldname, file, filename) => {
      if (!filename) return file.resume(); // skip empty file

      const saveTo = path.join(
        uploadsDir,
        `${Date.now()}-${Math.round(Math.random() * 1e9)}-${filename}`
      );
      uploadedFilePath = `/uploads/${path.basename(saveTo)}`;

      const writeStream = fs.createWriteStream(saveTo);
      file.pipe(writeStream);
    });

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('finish', async () => {
      const { name, description, price, stock } = fields;

      if (!name || !price || !stock)
        return res.status(400).json({ msg: 'Missing required fields.' });

      const newProduct = {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        imageUrl: uploadedFilePath || '',
      };

      shop.products.push(newProduct);
      await shop.save();

      res.status(201).json({
        msg: 'Product added successfully.',
        product: shop.products.at(-1),
      });
    });

    req.pipe(busboy);
  } catch (err) {
    console.error('🔥 Server error:', err);
    res.status(500).json({
      msg: 'Internal Server Error',
      error: err.message,
    });
  }
});

// --- Export for Cloud Function (matches YAML entry point) ---
exports.add_product = app;
