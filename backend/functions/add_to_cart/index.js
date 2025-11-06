const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Cart = require('./common/models/Cart.js');
const auth = require('./common/authMiddleware.js');

const app = express();

const FRONTEND_URL = 'https://aroundu-frontend-164909903360.asia-south1.run.app';

// --- 1️⃣ Global CORS Setup (must be FIRST middleware) ---
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- 2️⃣ Preflight Handler ---
app.options('*', (req, res) => {
  res.status(204).send('');
});

// --- 3️⃣ JSON Middleware ---
app.use(express.json());

// --- 4️⃣ Add product to cart ---
app.post('/', auth, async (req, res) => {
  await connectDB();
  const userId = req.user.id;
  const { shopId, productId, name, price, imageUrl, quantity = 1 } = req.body;

  if (!shopId || !productId) {
    return res.status(400).json({ msg: 'shopId and productId are required' });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (cart) {
      // Prevent mixing shops
      if (cart.shopId.toString() !== shopId.toString()) {
        return res.status(400).json({
          msg: 'Cart contains items from another shop. Clear the cart first.',
        });
      }

      const existing = cart.products.find(
        (p) => p.productId?.toString() === productId.toString()
      );

      if (existing) {
        existing.quantity += Number(quantity);
      } else {
        cart.products.push({ productId, name, price, imageUrl, quantity });
      }

      await cart.save();
      return res.json({ msg: 'Product added to cart', cart });
    }

    const newCart = new Cart({
      userId,
      shopId,
      products: [{ productId, name, price, imageUrl, quantity }],
    });

    await newCart.save();
    return res.status(201).json({ msg: 'Cart created and product added', cart: newCart });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// --- 5️⃣ Export to Cloud Function ---
exports.add_to_cart = app;
