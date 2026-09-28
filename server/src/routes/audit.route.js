const express = require("express");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const { getAuditLogs } = require("../controllers/audit.controller");

const router = express.Router();

router.get("/", protect, authorize("warden"), getAuditLogs);

module.exports = router;
