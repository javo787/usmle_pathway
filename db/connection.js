// db/connection.js
const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB уланди");
  } catch (err) {
    console.error("❌ MongoDB:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
