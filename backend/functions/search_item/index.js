const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Search products by name or category (case-insensitive)
app.get('/', async (req, res) => {
  await connectDB();

  const { query, category } = req.query;

  try {
    // Build search conditions
    let productMatch = {};
    if (query) {
      productMatch.name = { $regex: query, $options: 'i' };
    }
    if (category) {
      productMatch.category = { $regex: category, $options: 'i' };
    }

    // Find shops with matching products
    const shops = await Shop.find({
      products: { $elemMatch: productMatch }
    });

    // Collect matching products with shop info
    const results = [];
    shops.forEach(shop => {
      shop.products.forEach(product => {
        let match = true;
        if (query && !product.name.match(new RegExp(query, 'i'))) match = false;
        if (category && (!product.category || !product.category.match(new RegExp(category, 'i')))) match = false;
        if (match) {
          results.push({
            shopId: shop._id,
            shopName: shop.name,
            shopAddress: shop.address,
            product
          });
        }
      });
    });

    res.json({ results });
  } catch (err) {
    console.error("Error details:", err);
    res.status(500).send('Server error');
  }
});

exports.search_item = app;
