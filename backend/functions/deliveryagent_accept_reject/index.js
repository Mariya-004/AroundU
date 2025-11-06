require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./common/db.js');
const Order = require('./common/models/Order.js');
const auth = require('./common/authMiddleware.js');

const app = express();
connectDB();

// --- CORS ---
app.use(cors({
  origin: ['https://aroundu-frontend-164909903360.asia-south1.run.app', 'http://localhost:3000'],
  methods: ['PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

/**
 * @route   PATCH /
 * @desc    Delivery agent accepts or rejects assigned order
 * @access  Private (Delivery Agent Only)
 */
app.patch('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery_agent') {
      return res.status(403).json({ msg: 'Forbidden: Only delivery agents can update order status.' });
    }

    const { orderId, action } = req.body;
    if (!orderId || !action) {
      return res.status(400).json({ msg: 'orderId and action are required.' });
    }

    const validActions = ['accept', 'reject', 'picked_up', 'delivered'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ msg: `Invalid action. Use one of: ${validActions.join(', ')}` });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found.' });

    // Ensure this order is assigned to this agent
    if (!order.deliveryAgentId || order.deliveryAgentId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'This order is not assigned to you.' });
    }

    // Map actions → statuses
    const statusMap = {
      accept: 'accepted_by_agent',
      reject: 'rejected_by_agent',
      picked_up: 'picked_up',
      delivered: 'delivered'
    };

    order.status = statusMap[action];
    await order.save();

    res.status(200).json({
      msg: `Order ${action}ed successfully.`,
      order
    });

  } catch (err) {
    console.error('Error updating delivery agent order status:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.deliveryagent_orderstatus = app;
