const User = require("../models/user");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().populate(
      "provider",
      "name email isVerified"
    );
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("service", "title price")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const providers = await User.countDocuments({ role: "provider" });
    const services = await Service.countDocuments();
    const bookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({
      status: "completed",
    });

    res.json({
      users,
      providers,
      services,
      bookings,
      completedBookings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyProvider = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "provider") {
      return res
        .status(404)
        .json({ message: "Provider not found" });
    }

    user.isVerified = true;
    await user.save();

    res.json({
      message: "Provider verified successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reviews Management
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("service", "title")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Update service rating after deleting review
    const service = await Service.findById(review.service);
    if (service && service.totalReviews > 0) {
      const newTotalReviews = service.totalReviews - 1;
      const currentTotalRating = service.averageRating * service.totalReviews;
      const newAverageRating = newTotalReviews > 0 
        ? (currentTotalRating - review.rating) / newTotalReviews 
        : 0;
      
      service.totalReviews = newTotalReviews;
      service.averageRating = Math.round(newAverageRating * 10) / 10;
      await service.save();
    }
    
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Category Management
exports.getCategories = async (req, res) => {
  try {
    const categories = await Service.distinct("category");
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const count = await Service.countDocuments({ category });
        return { name: category, count };
      })
    );
    res.json(categoryStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    
    // Check if category already exists
    const existingService = await Service.findOne({ category: name });
    if (existingService) {
      return res.status(400).json({ message: "Category already exists" });
    }
    
    res.json({ message: "Category created successfully", name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ message: "Old and new category names are required" });
    }
    
    await Service.updateMany({ category: oldName }, { category: newName });
    res.json({ message: "Category updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { name } = req.params;
    
    // Check if any services use this category
    const servicesCount = await Service.countDocuments({ category: name });
    if (servicesCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. ${servicesCount} services are using this category.` 
      });
    }
    
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// User Details
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get user's bookings
    const bookings = await Booking.find({ user: req.params.id })
      .populate("service", "title price")
      .sort({ createdAt: -1 });
    
    // Get user's services if provider
    let services = [];
    if (user.role === "provider") {
      services = await Service.find({ provider: req.params.id })
        .populate("averageRating totalReviews");
    }
    
    // Get user's reviews
    const reviews = await Review.find({ user: req.params.id })
      .populate("service", "title")
      .sort({ createdAt: -1 });
    
    res.json({
      user,
      bookings,
      services,
      reviews,
      stats: {
        totalBookings: bookings.length,
        totalServices: services.length,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};