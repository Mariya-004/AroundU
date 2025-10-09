const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.post('/', auth, async (req, res) => {
  await connectDB();

  const {
    name,
    description,
    price,
    stock,
    imageUrl // <-- Add this field
  } = req.body;

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: User is not a shopkeeper.' });
    }

    // Find the shop for this shopkeeper
    const shop = await Shop.findOne({ shopkeeperId: userId });
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found for this shopkeeper.' });
    }

    // Add product to shop's products array
    const newProduct = { name, description, price, stock, imageUrl }; // <-- Include imageUrl
    shop.products.push(newProduct);
    await shop.save();

    res.status(201).json({ msg: 'Product added successfully', product: newProduct, shop });
  } catch (err) {
    console.error("Error details:", err);
    res.status(500).send('Server error');
  }
});

exports.add_product = app;
