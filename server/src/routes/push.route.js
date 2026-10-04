const express = require("express");

const protect = require("../middlewares/auth.middleware");

const {
  getPublicKey,
  subscribe,
  unsubscribe,
  sendTestPush,
} = require("../controllers/push.controller");

const router = express.Router();

router.get("/public-key", getPublicKey);

router.post("/subscribe", protect, subscribe);

router.delete("/unsubscribe", protect, unsubscribe);

// Temporary testing endpoint
router.post("/test", protect, sendTestPush);

module.exports = router;
