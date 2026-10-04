const express = require("express");

const protect = require("../middlewares/auth.middleware");

const {
  getPublicKey,
  subscribe,
  unsubscribe,
} = require("../controllers/push.controller");

const router = express.Router();

router.get("/public-key", getPublicKey);

router.post("/subscribe", protect, subscribe);

router.delete("/unsubscribe", protect, unsubscribe);

module.exports = router;
