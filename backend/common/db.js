const mongoose = require('mongoose');
require('dotenv').config();

// ============================
// THIS IS THE KEY CHANGE
// ============================
// We cache the database connection outside of the handler function.
// This allows the connection to be reused across multiple invocations
// of the same function instance, improving performance.
let cachedDb = null;

const connectDB = async () => {
  // If a cached connection exists, return it
  if (cachedDb) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  // Otherwise, create a new connection
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('New MongoDB connection established');
    cachedDb = conn; // Cache the connection for future use
    return cachedDb;
    
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;