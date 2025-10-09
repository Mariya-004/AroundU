const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  imageUrl: { type: String } // <-- Add this line
});

const shopSchema = new mongoose.Schema({
  shopkeeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  products: [productSchema],
}, { timestamps: true });

// Create 2dsphere index for geospatial queries
shopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Shop', shopSchema);
