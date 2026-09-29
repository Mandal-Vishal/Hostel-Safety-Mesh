const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getNodes,
  getNodeById,
} = require("../controllers/node.controller");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("warden", "security"),
  getNodes
);

router.get(
  "/:nodeId",
  protect,
  authorize("warden", "security"),
  getNodeById
);

module.exports = router;