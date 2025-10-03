const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Customer = require('./common/models/Customer.js');
const User = require('./common/models/User.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

app.post('/', auth, async (req, res) => {
  await connectDB();

  const {
    fullName,
    email,
    phoneNumber,
    homeAddress
  } = req.body;

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'customer') {
      return res.status(403).json({ msg: 'Forbidden: User is not a customer.' });
    }

    // Check if customer profile exists
    let customer = await Customer.findOne({ userId });

    if (customer) {
      // Update existing profile
      customer.fullName = fullName;
      customer.email = email;
      customer.phoneNumber = phoneNumber;
      customer.homeAddress = homeAddress;
      await customer.save();
      return res.status(200).json({ msg: 'Customer profile updated successfully', customer });
    }

    // Create new profile
    customer = new Customer({
      userId,
      fullName,
      email,
      phoneNumber,
      homeAddress
    });

    await customer.save();
    res.status(201).json({ msg: 'Customer profile created successfully', customer });
  } catch (err) {
    console.error("Error details:", err);
    res.status(500).send('Server error');
  }
});

// Only start the server if not running as a Google Cloud Function
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Customer profile service listening on port ${PORT}`);
  });
}

exports.customer_profile = app;