const mongoose = require("mongoose");

// Cache connection across serverless invocations
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI environment variable is not set!");
    return;
  }

  // Already connected — reuse
  if (cached.conn) {
    return cached.conn;
  }

  // Connection in progress — wait for it
  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((m) => {
        console.log("✅ MongoDB Atlas Connected");
        return m;
      })
      .catch((err) => {
        cached.promise = null; // reset so next request retries
        console.error("❌ MongoDB connection failed:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    console.error("❌ Could not connect to MongoDB:", err.message);
  }

  return cached.conn;
};

module.exports = connectDB;