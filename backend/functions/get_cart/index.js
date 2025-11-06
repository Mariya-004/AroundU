const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Cart = require('./common/models/Cart.js');
const auth = require('.common/authMiddleware.js');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// GET / -> get current authenticated user's cart details
app.get('/', auth, async (req, res) => {
  await connectDB();

  try {
    const userId = req.user.id;

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

    res.json({
      cart,
      totals: {
        totalItems,
        subtotal
      }
    });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Optional: endpoint to get cart by user id (admin usage)
// app.get('/:userId', auth, async (req, res) => { ... });

exports.get_cart = app;
