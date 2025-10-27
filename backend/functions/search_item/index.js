const express = require('express');
const cors = require('cors');
const connectDB = require('./common/db.js');
const Shop = require('./common/models/Shop.js'); // Assuming your model file is here

const app = express();

const FRONTEND_URL = 'https://aroundu-frontend-164909903360.asia-south1.run.app';

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Search products by name (case-insensitive) using a more efficient MongoDB Aggregation Pipeline
app.get('/', async (req, res) => {
  await connectDB();

  // Only the 'query' parameter is used, as 'category' is not in the schema
  const { query } = req.query;

  try {
    // The aggregation pipeline is a series of stages to process the data
    const pipeline = [];

    // Stage 1: Deconstruct the products array into a stream of documents
    // This creates a separate document for each product in each shop
    pipeline.push({ $unwind: '$products' });

    // Stage 2 (Conditional): If a search query is provided, filter the products by name
    if (query) {
      pipeline.push({
        $match: {
          'products.name': { $regex: query, $options: 'i' }
        }
      });
    }

    // Stage 3: Reshape the output to the desired format
    pipeline.push({
      $project: {
        _id: 0, // Exclude the default _id from the top-level document
        shopId: '$_id',
        shopName: '$name',
        shopAddress: '$address',
        product: '$products',
        productImageUrl: '$products.imageUrl'
      }
    });

    const results = await Shop.aggregate(pipeline);

    res.json({ results });
  } catch (err) {
    console.error("Error details:", err);
    res.status(500).send('Server error');
  }
});

exports.search_item = app;
