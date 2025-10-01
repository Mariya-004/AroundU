// common/db.js
const mongoose = require('mongoose');

// Cache the database connection to reuse it across function invocations
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    // The new Mongoose versions do not need the old options
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    cachedDb = conn;
    console.log('MongoDB connected');
    return cachedDb;
    
  } catch (err) {
    // In a serverless function, we should throw an error, not exit the process
    console.error('Database connection error:', err);
    throw new Error('Could not connect to the database.');
  }
};

module.exports = connectDB;