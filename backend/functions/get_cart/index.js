const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const connectDB = require('./common/db.js');
const Cart = require('./common/models/Cart.js');

const auth = require('./common/authMiddleware.js');
const Shop = require('./common/models/Shop.js');



const app = express();

// --- ✅ Cloud Run/Functions friendly CORS ---
app.use(cors({ origin: true }));
app.use(express.json());

// --- ✅ GET / — fetch current user's cart ---
app.get('/', async (req, res) => {
  const authHeader = req.header('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = req.header('x-auth-token') || bearerToken;

  if (!token) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  // Verify token
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

  // Connect to DB and fetch user's cart
  try {
    await connectDB();
    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(400).json({ msg: 'Token does not contain user id' });
    }

    const cart = await Cart.findOne({ userId }).populate('shopId', 'name address');

    if (!cart) {
      return res.json({
        cart: null,
        totals: { totalItems: 0, subtotal: 0 },
      });
    }

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
      totals: { totalItems, subtotal },
    });
  } catch (err) {
    console.error('Get cart error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// --- ✅ Export for Cloud Functions ---
exports.get_cart = app;

// --- ✅ Run locally when not deployed ---
if (!process.env.FUNCTION_TARGET) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`get_cart service listening on port ${PORT}`));
}
