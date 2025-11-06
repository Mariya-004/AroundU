require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Order = require('./common/models/Order.js');
const auth = require('./common/authMiddleware.js');

const app = express();
connectDB();

app.use(cors({
  origin: ['https://aroundu-frontend-164909903360.asia-south1.run.app', 'http://localhost:3000'],
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

/**
 * @route   GET /
 * @desc    Get order status for a customer
 * @access  Private (Customer Only)
 * @query   orderId (optional)
 */
app.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ msg: 'Forbidden: Only customers can view their orders.' });
    }

    const { orderId } = req.query;
    let orders;

    if (orderId) {
      // Fetch specific order
      orders = await Order.findOne({
        _id: orderId,
        customerId: req.user.id
      }).select('status totalAmount createdAt updatedAt products shopId');
      
      if (!orders) {
        return res.status(404).json({ msg: 'Order not found.' });
      }

      return res.status(200).json({
        msg: 'Order status fetched successfully.',
        order: orders
      });
    }

    // If no orderId, fetch all customer orders
    orders = await Order.find({ customerId: req.user.id })
      .select('status totalAmount createdAt updatedAt shopId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      msg: 'All orders fetched successfully.',
      orders
    });

  } catch (err) {
    console.error('Error fetching order status:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- Export for Google Cloud Function ---
exports.get_order_status = app;
