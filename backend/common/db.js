// common/db.js
const mongoose = require('mongoose');

let cachedDb = null;

const connectDB = async () => {
  console.log("Attempting to connect to the database...");

  if (cachedDb) {
    console.log("Reusing cached database connection.");
    return cachedDb;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("FATAL ERROR: MONGO_URI environment variable is not set.");
    // This will cause the function to fail loudly if the variable is missing
    throw new Error("MONGO_URI is not defined.");
  }

  console.log("MONGO_URI is present. Attempting mongoose.connect...");

  try {
    const conn = await mongoose.connect(mongoUri);
    cachedDb = conn;
    console.log("✅ MongoDB successfully connected.");
    return cachedDb;

  } catch (err) {
    console.error("❌ Database connection failed. Error details:", err);
    throw new Error('Could not connect to the database.');
  }
};

module.exports = connectDB;