const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Correctly import from the common folder
const connectDB = require('../../common/db.js');
const User = require('../../common/models/User.js');

const app = express();

// Use cors({ origin: true }) for better compatibility with Cloud Functions
app.use(cors({ origin: true }));
app.use(express.json());

// The path should be '/' because API Gateway handles the full URL
app.post('/', async (req, res) => {
  // ✅ Connect to the database INSIDE the handler
  await connectDB();

  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// The export is correct
exports.signup = app;