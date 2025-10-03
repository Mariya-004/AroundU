const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

app.post('/', auth, async (req, res) => {
  try {
    // Connect to MongoDB
    await connectDB();

    const userId = req.user.id;
    const { fullName, email, phoneNumber, homeAddress } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user || user.role !== 'customer') {
      return res.status(403).json({ msg: 'Forbidden: User is not a customer.' });
    }

    // Update profile fields
    if (fullName) user.name = fullName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber; // make sure User schema has this field
    if (homeAddress) user.address = homeAddress;

    await user.save();

    res.status(200).json({ msg: 'Customer profile updated successfully', customer: user });
  } catch (err) {
    console.error('Error details:', err);
    res.status(500).send('Server error');
  }
});

// Export for Cloud Functions Gen 2
exports.customer_profile = app;
