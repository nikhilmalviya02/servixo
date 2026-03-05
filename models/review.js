const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rating: Number,
    comment: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);