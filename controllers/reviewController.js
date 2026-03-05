const Review = require("../models/Review");
const Service = require("../models/Service");

exports.addReview = async (req, res) => {
  try {
    const { serviceId, rating, comment } = req.body;

    const existingReview = await Review.findOne({
      service: serviceId,
      user: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this service",
      });
    }

    const review = await Review.create({
      service: serviceId,
      user: req.user.id,
      rating,
      comment,
    });

    const reviews = await Review.find({ service: serviceId });

    const total = reviews.reduce(
      (acc, item) => acc + item.rating,
      0
    );

    const average = total / reviews.length;

    await Service.findByIdAndUpdate(serviceId, {
      averageRating: average,
      totalReviews: reviews.length,
    });

    res.status(201).json(review);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      service: req.params.serviceId,
    }).populate("user", "name");

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};