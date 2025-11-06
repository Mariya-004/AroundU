const express = require('express');
const cors = require('cors');
const connectDB = require('../customer_profile/common/db.js');
const Cart = require('./common/models/Cart.js');
const auth = require('../customer_profile/common/authMiddleware.js');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Add product to cart
// Body: { shopId, productId, name, price, imageUrl, quantity }
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
          msg: 'Cart contains items from a different shop. Clear the cart before adding items from another shop.'
        });
      }

      // Check if product already exists in cart
      const existing = cart.products.find(p => p.productId && p.productId.toString() === productId.toString());
      if (existing) {
        existing.quantity = (existing.quantity || 0) + Number(quantity);
        existing.updatedAt = new Date();
      } else {
        cart.products.push({
          productId,
          name,
          price,
          imageUrl,
          quantity: Number(quantity)
        });
      }

      await cart.save();
      return res.json({ msg: 'Product added to cart', cart });
    }

    // Create new cart for this user/shop
    cart = new Cart({
      userId,
      shopId,
      products: [{
        productId,
        name,
        price,
        imageUrl,
        quantity: Number(quantity)
      }]
    });

    await cart.save();
    return res.status(201).json({ msg: 'Cart created and product added', cart });
  } catch (err) {
    console.error('Add to cart error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// Optional: endpoint to clear cart (helpful when user wants to add from different shop)
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
