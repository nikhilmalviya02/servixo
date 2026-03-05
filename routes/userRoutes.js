const express = require("express");

const {
  addAddress,
  getAddresses,
  deleteAddress,
  updateAddress,
  getProviderProfile,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/address",
  protect,
  authorizeRoles("user"),
  addAddress
);

router.get(
  "/address",
  protect,
  authorizeRoles("user"),
  getAddresses
);

router.put(
  "/address/:addressId",
  protect,
  authorizeRoles("user"),
  updateAddress
);

router.delete(
  "/address/:addressId",
  protect,
  authorizeRoles("user"),
  deleteAddress
);

router.get("/provider/:id", getProviderProfile);

module.exports = router;