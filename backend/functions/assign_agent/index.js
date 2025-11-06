require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./common/db.js');
const auth = require('./common/authMiddleware.js');
const Order = require('./common/models/Order.js');
const User = require('./common/models/User.js');

const app = express();

// --- Database ---
connectDB();

// --- CORS Setup ---
const allowedOrigins = [
  'https://aroundu-frontend-164909903360.asia-south1.run.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed for this origin.'));
  },
  methods: ['PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

/**
 * @route   PATCH /
 * @desc    Assign delivery agent to an order
 * @access  Private (Shopkeeper Only)
 */
app.patch('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: Only shopkeepers can assign delivery agents.' });
    }

    const { orderId, deliveryAgentId } = req.body;

    if (!orderId || !deliveryAgentId) {
      return res.status(400).json({ msg: 'Order ID and Delivery Agent ID are required.' });
    }

    // Check if delivery agent exists and is available
    const agent = await User.findOne({ _id: deliveryAgentId, role: 'delivery_agent' });
    if (!agent) {
      return res.status(404).json({ msg: 'Delivery agent not found.' });
    }

    if (!agent.isAvailable) {
      return res.status(400).json({ msg: 'Selected delivery agent is not available.' });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found.' });
    }

    // Ensure shopkeeper owns this order
    if (order.shopId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You are not authorized to assign this order.' });
    }

    // Assign delivery agent and update status
    order.deliveryAgentId = deliveryAgentId;
    order.status = 'assigned';
    await order.save();

    // Optionally set agent unavailable (since now handling an order)
    await User.findByIdAndUpdate(deliveryAgentId, { isAvailable: false });

    return res.status(200).json({
      msg: 'Delivery agent assigned successfully.',
      order: {
        _id: order._id,
        status: order.status,
        deliveryAgent: {
          _id: agent._id,
          name: agent.name,
        },
      },
    });

  } catch (err) {
    console.error('Error assigning delivery agent:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.assign_delivery_agent = app;
