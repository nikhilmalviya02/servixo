const User = require("../models/User");
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

// Verification Management
exports.getVerifications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
    // Build query
    let query = { role: "provider", "verification.0": { $exists: true } };
    
    if (status && status !== "all") {
      query.overallVerificationStatus = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const providers = await User.find(query)
      .select("name email phone verification overallVerificationStatus createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    // Calculate verification stats
    const stats = {
      pending: await User.countDocuments({ role: "provider", overallVerificationStatus: "partial" }),
      verified: await User.countDocuments({ role: "provider", overallVerificationStatus: "verified" }),
      rejected: await User.countDocuments({ role: "provider", overallVerificationStatus: "rejected" }),
      notStarted: await User.countDocuments({ role: "provider", overallVerificationStatus: "not_started" })
    };
    
    res.json({
      providers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVerificationDetails = async (req, res) => {
  try {
    const provider = await User.findById(req.params.userId)
      .select("name email phone verification overallVerificationStatus createdAt")
      .populate("services", "title");
    
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    
    if (provider.role !== "provider") {
      return res.status(400).json({ message: "User is not a provider" });
    }
    
    res.json(provider);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateVerificationStatus = async (req, res) => {
  try {
    const { userId, section } = req.params;
    const { status, rejectionReason } = req.body;
    
    if (!["verified", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const validSections = [
      "aadharCard", "panCard", "drivingLicense", 
      "phone", "bankAccount", "profilePhoto"
    ];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: "Invalid verification section" });
    }
    
    const provider = await User.findById(userId);
    if (!provider || provider.role !== "provider") {
      return res.status(404).json({ message: "Provider not found" });
    }
    
    if (!provider.verification) {
      provider.verification = {};
    }
    
    // Update section status
    if (!provider.verification[section]) {
      provider.verification[section] = {};
    }
    
    provider.verification[section].status = status;
    provider.verification[section].verifiedAt = status === "verified" ? new Date() : null;
    provider.verification[section].rejectionReason = status === "rejected" ? rejectionReason : null;
    provider.verification[section].reviewedBy = req.user.id;
    provider.verification[section].reviewedAt = new Date();
    
    // Calculate overall verification status
    const sections = [
      provider.verification.aadharCard,
      provider.verification.panCard,
      provider.verification.drivingLicense,
      provider.verification.phone,
      provider.verification.bankAccount,
      provider.verification.profilePhoto
    ];
    
    const verifiedCount = sections.filter(s => s && s.status === "verified").length;
    const rejectedCount = sections.filter(s => s && s.status === "rejected").length;
    const pendingCount = sections.filter(s => s && s.status === "pending").length;
    
    if (verifiedCount === sections.length) {
      provider.overallVerificationStatus = "verified";
      provider.isVerified = true;
    } else if (rejectedCount > 0) {
      provider.overallVerificationStatus = "rejected";
      provider.isVerified = false;
    } else if (pendingCount > 0 || verifiedCount > 0) {
      provider.overallVerificationStatus = "partial";
      provider.isVerified = false;
    } else {
      provider.overallVerificationStatus = "not_started";
      provider.isVerified = false;
    }
    
    await provider.save();
    
    res.json({
      message: `${section} verification ${status} successfully`,
      verification: provider.verification,
      overallStatus: provider.overallVerificationStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reviewVerificationSection = async (req, res) => {
  try {
    const { userId, section } = req.params;
    const { reviewNote, action } = req.body;
    
    if (!["approve", "reject", "request_more"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }
    
    const validSections = [
      "aadharCard", "panCard", "drivingLicense", 
      "phone", "bankAccount", "profilePhoto"
    ];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: "Invalid verification section" });
    }
    
    const provider = await User.findById(userId);
    if (!provider || provider.role !== "provider") {
      return res.status(404).json({ message: "Provider not found" });
    }
    
    if (!provider.verification) {
      provider.verification = {};
    }
    
    if (!provider.verification[section]) {
      provider.verification[section] = {};
    }
    
    // Add review note
    if (!provider.verification[section].reviewNotes) {
      provider.verification[section].reviewNotes = [];
    }
    
    provider.verification[section].reviewNotes.push({
      note: reviewNote,
      action,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    });
    
    // Update status based on action
    if (action === "approve") {
      provider.verification[section].status = "verified";
      provider.verification[section].verifiedAt = new Date();
      provider.verification[section].rejectionReason = null;
    } else if (action === "reject") {
      provider.verification[section].status = "rejected";
      provider.verification[section].rejectionReason = reviewNote;
    } else if (action === "request_more") {
      provider.verification[section].status = "pending";
      provider.verification[section].rejectionReason = reviewNote;
    }
    
    provider.verification[section].reviewedBy = req.user.id;
    provider.verification[section].reviewedAt = new Date();
    
    await provider.save();
    
    res.json({
      message: `Review note added for ${section}`,
      verification: provider.verification
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
