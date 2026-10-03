const express = require("express");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const { getAnalyticsOverview } = require("../controllers/analytics.controller");

const router = express.Router();

/**
 * Warden-only operational analytics.
 */
router.get("/", protect, authorize("warden"), getAnalyticsOverview);

module.exports = router;
