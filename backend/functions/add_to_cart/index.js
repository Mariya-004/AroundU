const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Cart = require('./common/models/Cart.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// ✅ Define your frontend URL
const FRONTEND_URL = 'https://aroundu-frontend-164909903360.asia-south1.run.app';

// ✅ CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// ✅ Explicitly handle all preflight OPTIONS requests
app.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', FRONTEND_URL);
  res.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send('');
});

// ✅ Add product to cart
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
      // Enforce single-shop constraint
      if (cart.shopId.toString() !== shopId.toString()) {
        return res.status(400).json({
          msg: 'Cart contains items from another shop. Clear cart first.'
        });
      }

      const existing = cart.products.find(p => p.productId?.toString() === productId.toString());
      if (existing) {
        existing.quantity += Number(quantity);
      } else {
        cart.products.push({ productId, name, price, imageUrl, quantity });
      }

      await cart.save();
      return res.json({ msg: 'Product added to cart', cart });
    }

    // Create a new cart
    const newCart = new Cart({
      userId,
      shopId,
      products: [{ productId, name, price, imageUrl, quantity }]
    });

    await newCart.save();
    return res.status(201).json({ msg: 'Cart created and product added', cart: newCart });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ✅ Delete cart
app.delete('/', auth, async (req, res) => {
  await connectDB();
  const userId = req.user.id;
  try {
    await Cart.findOneAndDelete({ userId });
    return res.json({ msg: 'Cart cleared' });
  } catch (err) {
    console.error('Clear cart error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

exports.add_to_cart = app;
