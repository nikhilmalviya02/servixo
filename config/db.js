const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI environment variable is not set!");
      return;
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Atlas Connected");
  } catch (error) {
    // Do NOT call process.exit(1) in Vercel serverless — it kills the entire
    // runtime and prevents Express from handling any requests at all.
    console.error("❌ MongoDB connection failed:", error.message);
  }
};

module.exports = connectDB;