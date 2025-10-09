const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import shared modules from the 'common' directory
const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');

const app = express();

// Apply middleware
app.use(cors({ origin: true }));
app.use(express.json());

// The route path is '/', as API Gateway will handle the full path
app.post('/', async (req, res) => {
  // Establish the database connection inside the handler
  await connectDB();

  const { email, password, role } = req.body; // <-- ADD 'role' HERE

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // <-- ADD THIS BLOCK -->
    // Check if the role from the request matches the user's role in the DB
    if (user.role !== role) {
      return res.status(400).json({ msg: 'Invalid credentials for the selected role' });
    }
    // <-- END OF ADDED BLOCK -->

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // If credentials are valid, generate a JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Export the app as 'login' to be used as the function's entry point
exports.login = app;