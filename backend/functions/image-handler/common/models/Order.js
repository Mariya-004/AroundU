const mongoose = require('mongoose');

const orderProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
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
  status: { type: String, enum: ['pending', 'accepted', 'picked_up', 'delivered'], default: 'pending' },
  deliveryAddress: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
