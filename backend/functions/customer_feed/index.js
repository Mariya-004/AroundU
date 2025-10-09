const express = require('express');
const cors = require('cors');
// Corrected paths to go up one directory level
const connectDB = require('./common/db.js');
const User = require('./common/models/User.js');
const Shop = require('./common/models/Shop.js');
const auth = require('./common/authMiddleware.js');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * @route   GET /
 * @desc    Get the customer's profile and find nearby shops based on their saved delivery location.
 * @access  Private (Requires customer role)
 */
app.get('/', auth, async (req, res) => {
  await connectDB();

  try {
    const userId = req.user.id;

    // --- 1. FETCH THE CUSTOMER'S PROFILE ---
    const customer = await User.findById(userId).select('-password');

    if (!customer) {
      return res.status(404).json({ msg: 'Customer profile not found.' });
    }
    if (customer.role !== 'customer') {
        return res.status(403).json({ msg: 'Forbidden: User is not a customer.' });
    }
    
    // --- 2. VALIDATE THE DELIVERY LOCATION ---
    // Check if the customer has a valid, saved delivery location.
    if (!customer.location || !customer.location.coordinates || customer.location.coordinates.length !== 2) {
        return res.status(400).json({ 
            msg: 'No delivery location set for this customer. Please update your profile with a delivery location first.',
            customerProfile: { // Still send back the profile so the frontend knows who the user is
                name: customer.name,
                email: customer.email,
                homeAddress: customer.address,
                phoneNumber: customer.phoneNumber
            }
        });
    }
    
    const [longitude, latitude] = customer.location.coordinates;

    // --- 3. FIND NEARBY SHOPS USING THE CUSTOMER'S LOCATION ---
    // Use a default radius of 5km. This could also be a query param if you want it to be dynamic.
    const searchRadius = 5; 
    const radiusInMeters = searchRadius * 1000;

    const nearbyShops = await Shop.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude] // MongoDB requires [lng, lat]
          },
          $maxDistance: radiusInMeters
        }
      }
    });

    // --- 4. RETURN A UNIFIED RESPONSE ---
    // The response now contains both the customer's details and the list of nearby shops.
    res.status(200).json({
      msg: `${nearbyShops.length} shop(s) found near your saved location.`,
      customerProfile: {
        name: customer.name,
        email: customer.email,
        homeAddress: customer.address,
        phoneNumber: customer.phoneNumber,
        deliveryLocation: customer.location
      },
      shops: nearbyShops
    });

  } catch (err) {
    console.error("Error processing customer home feed:", err);
    res.status(500).send('Server error');
  }
});

exports.customer_feed = app;

