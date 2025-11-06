// common/models/Order.js
const mongoose = require('mongoose');

const orderProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  deliveryAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // assigned later

  products: [orderProductSchema],
  totalAmount: { type: Number, required: true },
  deliveryAddress: { type: String, required: true },

  // Status flow:
  status: {
    type: String,
    enum: [
      'pending',             // Customer placed order
      'accepted',            // Shopkeeper accepted
      'rejected',            // Shopkeeper rejected
      'assigned',            // Shopkeeper assigned agent
      'accepted_by_agent',   // Agent accepted
      'rejected_by_agent',   // Agent rejected
      'picked_up',           // Agent picked order
      'delivered'            // Completed
    ],
    default: 'pending',
  },

  // Timestamps for tracking
  assignedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
