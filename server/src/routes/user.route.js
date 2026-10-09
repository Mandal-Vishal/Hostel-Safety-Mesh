const express = require("express");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const {
  getMe,
  getResidents,
  createResident,
} = require("../controllers/user.controller");

const router = express.Router();

// Any authenticated user can view their own profile
router.get("/me", protect, getMe);

// Warden-only resident management
router.get(
  "/residents",
  protect,
  authorize("warden"),
  getResidents
);

router.post(
  "/residents",
  protect,
  authorize("warden"),
  createResident
);

module.exports = router;
