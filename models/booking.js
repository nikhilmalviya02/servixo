const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    address: {
      label: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    date: Date,
    timeSlot: String,
    isEmergency: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);