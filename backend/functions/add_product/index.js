require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// --- Database Connection ---
// Call connectDB here at the global scope for better performance in a serverless environment.
connectDB();

// --- CORS Configuration ---
// This list now includes your local development environment as an allowed origin.
const allowedOrigins = [
    'https://aroundu-frontend-164909903360.asia-south1.run.app',
    'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// --- Main Endpoint: Add a Product ---
app.post('/', auth, async (req, res) => {
  try {
    console.log('[HANDLER] Add product handler started.');

    // 1. Validate user role from the JWT payload
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ msg: 'Forbidden: This action requires a shopkeeper account.' });
    }

    // 2. Extract product details from the request body
    const { name, description, price, stock } = req.body;

    // 3. Validate required fields
    if (!name || !price || !stock) {
      return res.status(400).json({ msg: 'Product name, price, and stock are required fields.' });
    }

    // 4. Find the shop belonging to the authenticated user
    let shop = await Shop.findOne({ shopkeeperId: req.user.id });

    // If the shopkeeper doesn't have a shop, create one automatically
    if (!shop) {
      console.log(`No shop found for shopkeeper ${req.user.id}, creating a new one.`);
      shop = new Shop({
        shopkeeperId: new mongoose.Types.ObjectId(req.user.id),
        name: `${req.user.name || 'Shopkeeper'}'s Shop`, // Use user's name for a better default
        address: 'Default Address',
        location: { type: 'Point', coordinates: [0, 0] },
        products: [],
      });
      await shop.save();
    }

    // 5. Create the new product object
    const newProduct = {
      name,
      description: description || '',
      price: parseFloat(price),
      stock: parseInt(stock, 10),
    };

    // 6. Add the new product and save the shop
    shop.products.push(newProduct);
    await shop.save();

    console.log(`Product "${name}" added to shop ${shop._id}`);

    // 7. Return the success response with the new product AND the shopId
    return res.status(201).json({
      msg: 'Product created successfully. You can now upload an image.',
      newProduct: shop.products[shop.products.length - 1],
      shopId: shop._id
    });

  } catch (err) {
    console.error('Error in add_product endpoint:', err);
    return res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

exports.add_product = app;

