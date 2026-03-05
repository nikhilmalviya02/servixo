const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/user", protect, (req, res) => {
  res.json({ message: "User route", user: req.user });
});

router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "Admin route" });
});

module.exports = router;