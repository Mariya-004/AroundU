console.log("✅ Signup function is loading...");
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Correctly import from the common folder
const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');

const app = express();

// Use cors({ origin: true }) for better compatibility with Cloud Functions
app.use(cors({ origin: true }));
app.use(express.json());

// The path should be '/' because the function URL itself is the base path
app.post('/', async (req, res) => {
  try {
    // Connect to the database INSIDE the handler
    await connectDB();

    const { name, email, password, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({ name, email, password, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

  } catch (err) {
    console.error('Error during user signup:', err);
    res.status(500).send('Server error');
  }
});


// ✅ **CRITICAL PART FOR DEPLOYMENT** ✅
// This line exports your express app for Google Cloud Functions
exports.signup = app;


// ✅ **CRITICAL PART FOR LOCAL TESTING** ✅
// This block only runs when you execute "node index.js" directly
// It will NOT run when the code is deployed to Cloud Functions
if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}