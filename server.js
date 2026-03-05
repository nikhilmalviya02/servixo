require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Connect Database
connectDB();

// CORS Configuration - MUST be before other middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://servixofrontend.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// Export for Vercel
module.exports = app;