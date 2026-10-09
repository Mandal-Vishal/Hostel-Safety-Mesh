const express = require("express");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const {
  getAdminStats,
  getUsers,
  createStaff,
  setStaffStatus,
} = require("../controllers/admin.controller");

const router = express.Router();

// All endpoints below require an authenticated Admin.
router.get(
  "/stats",
  protect,
  authorize("admin"),
  getAdminStats
);

router.get(
  "/users",
  protect,
  authorize("admin"),
  getUsers
);

router.post(
  "/staff",
  protect,
  authorize("admin"),
  createStaff
);

router.patch(
  "/users/:id/status",
  protect,
  authorize("admin"),
  setStaffStatus
);

module.exports = router;