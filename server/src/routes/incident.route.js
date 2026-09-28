const express = require("express");

const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const {
  createSOS,
  getMyIncidents,
  getIncidents,
  getIncidentById,
  acknowledgeIncident,
  escalateIncident,
  resolveIncident,
} = require("../controllers/incident.controller");

const router = express.Router();

// Resident
router.post(
  "/sos",
  protect,
  authorize("resident"),
  createSOS
);

router.get(
  "/my",
  protect,
  authorize("resident"),
  getMyIncidents
);

// Warden + Security
router.get(
  "/",
  protect,
  authorize("warden", "security"),
  getIncidents
);

router.get(
  "/:incidentId",
  protect,
  getIncidentById
);

// Warden
router.patch(
  "/:incidentId/acknowledge",
  protect,
  authorize("warden"),
  acknowledgeIncident
);

router.patch(
  "/:incidentId/escalate",
  protect,
  authorize("warden"),
  escalateIncident
);

// Warden + Security
router.patch(
  "/:incidentId/resolve",
  protect,
  authorize("warden", "security"),
  resolveIncident
);

module.exports = router;