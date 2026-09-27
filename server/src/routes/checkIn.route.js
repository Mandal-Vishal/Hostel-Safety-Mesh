const express = require("express");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const {
  checkIn,
  getMyCheckIns,
  generateExpectedCheckIns,
  evaluateMissedCheckIns,
  getAllCheckIns,
} = require("../controllers/checkIn.controller");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("resident"),
  checkIn
);

router.get(
  "/my",
  protect,
  authorize("resident"),
  getMyCheckIns
);

router.post(
  "/generate",
  protect,
  authorize("warden"),
  generateExpectedCheckIns
);

router.post(
  "/evaluate-missed",
  protect,
  authorize("warden"),
  evaluateMissedCheckIns
);

router.get(
  "/",
  protect,
  authorize("warden", "security"),
  getAllCheckIns
);

module.exports = router;