require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./common/db.js');
const Order = require('./common/models/Order.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- Connect DB ---
connectDB();

// --- CORS ---
const allowedOrigins = [
  'https://aroundu-frontend-164909903360.asia-south1.run.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed for this origin.'));
  },
  methods: ['PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

/**
 * @route   PATCH /
 * @desc    Update order status (accept, picked_up, delivered, reject)
 * @access  Private (Shopkeeper only)
 */
app.patch('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Only shopkeepers can update order status.' });
    }

    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ msg: 'orderId and status are required.' });
    }

    const validStatuses = ['accepted', 'picked_up', 'delivered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: `Invalid status. Use one of: ${validStatuses.join(', ')}` });
    }

    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found.' });
    }

    // Check that the shop belongs to the logged-in shopkeeper
    if (order.shopId.toString() !== req.user.shopId) {
      return res.status(403).json({ msg: 'Forbidden: You can only manage orders for your own shop.' });
    }

    // Update status
    order.status = status;
    await order.save();

    return res.status(200).json({
      msg: `Order status updated to '${status}'.`,
      order,
    });

  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- Export Cloud Function ---
exports.order_status = app;
