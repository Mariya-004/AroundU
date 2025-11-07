const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./common/db.js');
const auth = require('./common/authMiddleware.js');

// Import all necessary models
const Cart = require('./common/models/Cart.js');
const Shop = require('./common/models/Shop.js');
const Order = require('./common/models/Order.js');
// Add User model import so we can read saved location/address
const User = require('./common/models/User.js');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// --- Checkout API ---
// POST /
// Body: { "deliveryAddress": "123 Main St, Anytown" }

app.post('/', auth, async (req, res) => {
  await connectDB();

  const customerId = req.user.id;

  // --- Retrieve deliveryAddress from user profile (prefer address, fallback to location coordinates) ---
  let deliveryAddress = null;
  try {
    const user = await User.findById(customerId).select('location address').lean();
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Prefer human-readable address if provided
    if (user.address && typeof user.address === 'string' && user.address.trim() !== '') {
      deliveryAddress = user.address.trim();
    } else if (user.location && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
      const [lng, lat] = user.location.coordinates;
      // Treat schema default [0,0] as "not set"
      if (lng === 0 && lat === 0) {
        return res.status(400).json({ msg: 'Delivery location not set in user profile. Please set your location before checkout.' });
      }
      // Use a simple lat,lng string as deliveryAddress
      deliveryAddress = `${lat},${lng}`;
    } else {
      return res.status(400).json({ msg: 'Delivery address not set in user profile. Please set your address or location before checkout.' });
    }
  } catch (err) {
    console.error('Error fetching user location:', err);
    return res.status(500).json({ msg: 'Server error fetching user profile.' });
  }

  // 2. Get the user's cart
  const cart = await Cart.findOne({ userId: customerId });
  if (!cart || cart.products.length === 0) {
    return res.status(404).json({ msg: 'Your cart is empty.' });
  }

  // 3. Get the shop to validate stock
  // We use `select('+products.stock')` just in case you ever make stock non-selectable by default
  const shop = await Shop.findById(cart.shopId).select('+products.stock');
  if (!shop) {
    // This should rarely happen, but it's good to check
    await cart.deleteOne(); // Clear the invalid cart
    return res.status(404).json({ msg: 'Associated shop not found. Cart has been cleared.' });
  }

  // 4. Start a Database Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let totalAmount = 0;
    const orderProducts = [];
    const stockUpdateOperations = [];

    // 5. Check stock and prepare order data (inside the transaction)
    for (const cartProduct of cart.products) {
      // Find the corresponding product in the shop's sub-document array
      // .id() is a fast, built-in Mongoose helper for sub-documents
      const shopProduct = shop.products.id(cartProduct.productId);

      // Check if product still exists in the shop
      if (!shopProduct) {
        throw new Error(`Product "${cartProduct.name}" is no longer available.`);
      }

      // Check for sufficient stock
      if (shopProduct.stock < cartProduct.quantity) {
        throw new Error(`Insufficient stock for "${cartProduct.name}". Only ${shopProduct.stock} left.`);
      }

      // All good. Add to our order data.
      const productTotal = cartProduct.price * cartProduct.quantity;
      totalAmount += productTotal;

      orderProducts.push({
        productId: cartProduct.productId,
        name: cartProduct.name,
        quantity: cartProduct.quantity,
        price: cartProduct.price, // Use price from cart (price at time of adding)
      });

      // Prepare the stock update operation for bulk write
      stockUpdateOperations.push({
        updateOne: {
          filter: { _id: shop._id, 'products._id': shopProduct._id },
          update: { $inc: { 'products.$.stock': -cartProduct.quantity } }
        }
      });
    }

    // 6. Create the new Order
    const newOrder = new Order({
      customerId: customerId,
      shopId: cart.shopId,
      products: orderProducts,
      totalAmount: totalAmount,
      status: 'pending',
      deliveryAddress: deliveryAddress, // use location from User schema
    });
    
    // Save the order *within the transaction*
    await newOrder.save({ session });

    // 7. Update shop stock in bulk *within the transaction*
    await Shop.bulkWrite(stockUpdateOperations, { session });

    // 8. Delete the cart *within the transaction*
    await Cart.deleteOne({ _id: cart._id }, { session });

    // 9. Commit the transaction
    // If all operations above succeeded, this makes them permanent
    await session.commitTransaction();

    // 10. Success! Send the new order to the client.
    res.status(201).json(newOrder);

  } catch (err) {
    // 11. Abort the transaction
    // If anything failed, undo all database changes from this session
    await session.abortTransaction();
    
    console.error('Checkout transaction error:', err);

    // Send a specific error message to the user (e.g., "Insufficient stock")
    if (err.message.includes('stock') || err.message.includes('available')) {
      return res.status(409).json({ msg: err.message }); // 409 Conflict
    }

    // Otherwise, send a generic server error
    res.status(500).json({ msg: 'Server error during checkout.' });
  } finally {
    // 12. Always end the session
    session.endSession();
  }
});

exports.checkout = app;