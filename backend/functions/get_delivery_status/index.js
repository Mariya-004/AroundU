require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./common/db.js');
const Order = require('./common/models/Order.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();
connectDB();

app.use(cors({
  origin: ['https://aroundu-frontend-164909903360.asia-south1.run.app', 'http://localhost:3000'],
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

/**
 * @route   GET /
 * @desc    Get delivery status (visible to both shopkeeper and customer)
 * @access  Private (Shopkeeper or Customer)
 * @query   orderId (required)
 */
app.get('/', auth, async (req, res) => {
  try {
    if (!['shopkeeper', 'customer'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden: Only shopkeeper or customer can view delivery status.' });
    }

    const { orderId } = req.query;
    if (!orderId) return res.status(400).json({ msg: 'orderId is required.' });

    const order = await Order.findById(orderId)
      .populate('deliveryAgentId', 'name phoneNumber isAvailable currentLocation')
      .select('status updatedAt createdAt totalAmount deliveryAgentId');

    if (!order) return res.status(404).json({ msg: 'Order not found.' });

    res.status(200).json({
      msg: 'Delivery status fetched successfully.',
      order
    });
  } catch (err) {
    console.error('Error fetching delivery status:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.get_delivery_status = app;
