const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const connectDB = require('./common/db.js');
const Cart = require('./common/models/Cart.js');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// GET / -> get current authenticated user's cart details
app.get('/', async (req, res) => {
  // 1) Token extraction (support both Authorization: Bearer <token> and x-auth-token)
  const authHeader = req.header('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = req.header('x-auth-token') || bearerToken;

  if (!token) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  // 2) Verify token
  let decoded;
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set in environment');
      return res.status(500).json({ msg: 'Server configuration error: JWT secret missing' });
    }
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ msg: 'Token is not valid' });
  }

  // 3) Connect DB and fetch cart
  try {
    await connectDB();

    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(400).json({ msg: 'Token does not contain user id' });
    }

    // find cart and populate shop info (name, address)
    const cart = await Cart.findOne({ userId }).populate('shopId', 'name address');

    if (!cart) {
      return res.json({
        cart: null,
        totals: { totalItems: 0, subtotal: 0 }
      });
    }

    // compute totals
    let totalItems = 0;
    let subtotal = 0;
    cart.products.forEach((p) => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.price) || 0;
      totalItems += qty;
      subtotal += price * qty;
    });

    return res.json({
      cart,
      totals: {
        totalItems,
        subtotal
      }
    });
  } catch (err) {
    console.error('Get cart error:', err);
    // Return error message to help debugging (remove err.message in production)
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Export for Cloud Functions compatibility
exports.get_cart = app;

// If run as a standalone server (e.g. deployed to Cloud Run), start listening on the expected PORT
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`get_cart service listening on port ${PORT}`);
  });
}
