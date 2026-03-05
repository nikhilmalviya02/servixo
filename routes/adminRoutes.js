const express = require("express");
const {
  getUsers,
  getServices,
  getBookings,
  getStats,
  verifyProvider,
  deleteUser,
  deleteService,
  deleteBooking,
  getReviews,
  deleteReview,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getUserDetails,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/users", protect, authorizeRoles("admin"), getUsers);
router.get("/services", protect, authorizeRoles("admin"), getServices);
router.get("/bookings", protect, authorizeRoles("admin"), getBookings);
router.get("/stats", protect, authorizeRoles("admin"), getStats);

router.put("/verify/:id", protect, authorizeRoles("admin"), verifyProvider);

router.delete("/user/:id", protect, authorizeRoles("admin"), deleteUser);
router.delete("/service/:id", protect, authorizeRoles("admin"), deleteService);
router.delete("/booking/:id", protect, authorizeRoles("admin"), deleteBooking);

// Reviews Management
router.get("/reviews", protect, authorizeRoles("admin"), getReviews);
router.delete("/review/:id", protect, authorizeRoles("admin"), deleteReview);

// Category Management
router.get("/categories", protect, authorizeRoles("admin"), getCategories);
router.post("/categories", protect, authorizeRoles("admin"), createCategory);
router.put("/categories", protect, authorizeRoles("admin"), updateCategory);
router.delete("/categories/:name", protect, authorizeRoles("admin"), deleteCategory);

// User Details
router.get("/user/:id/details", protect, authorizeRoles("admin"), getUserDetails);

module.exports = router;