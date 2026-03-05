const express = require("express");
const {
  createService,
  getServices,
  deleteService,
} = require("../controllers/serviceController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/",
  (req, res, next) => {
    console.log("POST /api/services hit");
    next();
  },
  protect,
  authorizeRoles("provider"),
  createService
);

router.get("/", (req, res, next) => {
  console.log("GET /api/services hit");
  next();
}, getServices);

router.delete(
  "/:id",
  protect,
  authorizeRoles("provider"),
  deleteService
);

module.exports = router;