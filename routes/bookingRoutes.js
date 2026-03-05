const express = require("express");

const {
  createBooking,
  getProviderBookings,
  updateBooking,
  getUserBookings, 
  cancelBooking,
  rescheduleBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", protect, authorizeRoles("user"), createBooking);

router.get("/", protect, authorizeRoles("provider"), getProviderBookings);

router.get(
  "/user",
  protect,
  authorizeRoles("user"),
  getUserBookings
);

router.put(
  "/:id",
  protect,
  authorizeRoles("provider"),
  updateBooking
);

router.put(
  "/cancel/:id",
  protect,
  authorizeRoles("user"),
  cancelBooking
);

router.put(
  "/reschedule/:id",
  protect,
  authorizeRoles("user"),
  rescheduleBooking
);

module.exports = router;