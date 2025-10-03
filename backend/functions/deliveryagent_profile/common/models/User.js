const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'shopkeeper', 'delivery_agent'], required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // Default location field
  },
  address: { type: String }, // optional manual address
  
  // --- NEW FIELDS ADDED FOR DELIVERY AGENT PROFILE ---
  phoneNumber: { type: String, unique: true, sparse: true }, // unique constraint, sparse for optionality
  vehicleType: { type: String, enum: ['bike', 'car', 'van', 'foot'] }, // Example types
  currentLocation: { // Stores agent's real-time/last reported location (GeoJSON)
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: false } // [longitude, latitude]
  }
  // ---------------------------------------------------

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Create 2dsphere index for delivery agent's current location to enable geo-queries
userSchema.index({ currentLocation: '2dsphere' }, { background: true });

module.exports = mongoose.model('User', userSchema);
