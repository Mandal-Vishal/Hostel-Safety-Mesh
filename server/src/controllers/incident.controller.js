const Incident = require("../models/incident.model");
const User = require("../models/user.model");
const { sendPushToUser, sendPushToRoles } = require("../services/push.service");

const formatDateIST = require("../utils/formatDate");
const { createAuditLog } = require("../services/audit.service");

const { sanitizeIncident, sanitizeIncidents } = require("../utils/privacy");

const generateIncidentId = () => {
  return `INC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
};

const MAX_REASON_LENGTH = 500;

/**
 * Format an already privacy-filtered incident.
 */
const formatSafeIncident = (incident, role) => {
  const data = sanitizeIncident(incident, role);

  if (!data) {
    return null;
  }

  return {
    ...data,

    createdAt: formatDateIST(data.createdAt),

    updatedAt: formatDateIST(data.updatedAt),

    acknowledgedAt: formatDateIST(data.acknowledgedAt),

    escalatedAt: formatDateIST(data.escalatedAt),

    resolvedAt: formatDateIST(data.resolvedAt),
  };
};

/**
 * Normalize optional text input.
 */
const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_REASON_LENGTH);
};

/**
 * ---------------------------------------------------------
 * RESIDENT CREATES SOS
 * ---------------------------------------------------------
 */
const createSOS = async (req, res) => {
  try {
    /**
     * SECURITY:
     *
     * Never trust a location supplied by
     * req.body.
     *
     * The authenticated server-side user
     * state is authoritative.
     */
    const location = req.user.currentZone || req.user.hostel || null;

    const incident = await Incident.create({
      incidentId: generateIncidentId(),

      type: "SOS",

      source: {
        type: "RESIDENT_APP",

        userId: req.user._id,

        nodeId: null,
      },

      residentId: req.user._id,

      location,

      status: "PENDING",
    });

    await createAuditLog({
      action: "SOS_CREATED",

      actor: {
        type: "USER",

        userId: req.user._id,

        role: req.user.role,
      },

      entity: {
        type: "INCIDENT",

        entityId: incident._id,
      },

      previousState: null,

      newState: "PENDING",

      metadata: {
        reason: "Resident triggered SOS",
      },
    });

    sendPushToRoles(["warden"], {
      title: "New SOS Alert",
      body: `Immediate assistance required • ${
        location?.building || "Unknown Block"
      } • Floor ${location?.floor ?? "-"}`,
      url: "/warden/active-sos",
      tag: `sos-${incident.incidentId}`,
      requireInteraction: true,
    }).catch((error) => {
      console.error("Warden SOS push failed:", error.message);
    });

    await incident.populate("residentId", "firstName lastName email role");

    const wardenIncident = formatSafeIncident(incident, "warden");

    const residentIncident = formatSafeIncident(incident, "resident");

    const io = req.app.get("io");

    if (io) {
      io.to("role:warden").emit("incident:new", {
        incident: wardenIncident,
      });

      io.to(`user:${req.user._id.toString()}`).emit("incident:created", {
        incident: residentIncident,
      });
    }

    return res.status(201).json({
      success: true,

      message: "SOS received successfully",

      incident: residentIncident,
    });
  } catch (error) {
    console.error("Create SOS error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to create SOS",
    });
  }
};

/**
 * ---------------------------------------------------------
 * RESIDENT INCIDENTS
 * ---------------------------------------------------------
 */
const getMyIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({
      residentId: req.user._id,
    })
      .sort({
        createdAt: -1,
      })
      .limit(50);

    return res.json({
      success: true,

      incidents: sanitizeIncidents(incidents, "resident").map((incident) => ({
        ...incident,

        createdAt: formatDateIST(incident.createdAt),

        updatedAt: formatDateIST(incident.updatedAt),

        acknowledgedAt: formatDateIST(incident.acknowledgedAt),

        escalatedAt: formatDateIST(incident.escalatedAt),

        resolvedAt: formatDateIST(incident.resolvedAt),
      })),
    });
  } catch (error) {
    console.error("Get my incidents error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch incidents",
    });
  }
};

/**
 * ---------------------------------------------------------
 * WARDEN / SECURITY INCIDENT VIEW
 * ---------------------------------------------------------
 */
const getIncidents = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      const status = String(req.query.status).toUpperCase();

      const allowedStatuses = [
        "PENDING",
        "ACKNOWLEDGED",
        "ESCALATED",
        "RESOLVED",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,

          message: "Invalid incident status",
        });
      }

      filter.status = status;
    }

    const incidents = await Incident.find(filter)
      .populate("residentId", "firstName lastName email role")
      .populate("acknowledgedBy", "firstName lastName role")
      .populate("escalatedTo", "firstName lastName role")
      .populate("resolvedBy", "firstName lastName role")
      .sort({
        createdAt: -1,
      })
      .limit(100);

    return res.json({
      success: true,

      incidents: sanitizeIncidents(incidents, req.user.role).map(
        (incident) => ({
          ...incident,

          createdAt: formatDateIST(incident.createdAt),

          updatedAt: formatDateIST(incident.updatedAt),

          acknowledgedAt: formatDateIST(incident.acknowledgedAt),

          escalatedAt: formatDateIST(incident.escalatedAt),

          resolvedAt: formatDateIST(incident.resolvedAt),
        }),
      ),
    });
  } catch (error) {
    console.error("Get incidents error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch incidents",
    });
  }
};

/**
 * ---------------------------------------------------------
 * GET ONE INCIDENT
 * ---------------------------------------------------------
 */
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findOne({
      incidentId: req.params.incidentId,
    })
      .populate("residentId", "firstName lastName email role")
      .populate("acknowledgedBy", "firstName lastName role")
      .populate("escalatedTo", "firstName lastName role")
      .populate("resolvedBy", "firstName lastName role");

    if (!incident) {
      return res.status(404).json({
        success: false,

        message: "Incident not found",
      });
    }

    /**
     * Residents may only access their
     * own incidents.
     */
    if (req.user.role === "resident") {
      if (
        !incident.residentId ||
        incident.residentId._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,

          message: "Access denied",
        });
      }
    }

    return res.json({
      success: true,

      incident: formatSafeIncident(incident, req.user.role),
    });
  } catch (error) {
    console.error("Get incident error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch incident",
    });
  }
};

/**
 * ---------------------------------------------------------
 * ACKNOWLEDGE INCIDENT
 * ---------------------------------------------------------
 *
 * Valid transition:
 *
 * PENDING → ACKNOWLEDGED
 */
const acknowledgeIncident = async (req, res) => {
  try {
    const incident = await Incident.findOne({
      incidentId: req.params.incidentId,
    });

    if (!incident) {
      return res.status(404).json({
        success: false,

        message: "Incident not found",
      });
    }

    if (incident.status !== "PENDING") {
      return res.status(400).json({
        success: false,

        message: `Cannot acknowledge incident in ${incident.status} state`,
      });
    }

    const previousState = incident.status;

    incident.status = "ACKNOWLEDGED";

    incident.acknowledgedAt = new Date();

    incident.acknowledgedBy = req.user._id;

    await incident.save();

    await createAuditLog({
      action: "INCIDENT_ACKNOWLEDGED",

      actor: {
        type: "USER",

        userId: req.user._id,

        role: req.user.role,
      },

      entity: {
        type: "INCIDENT",

        entityId: incident._id,
      },

      previousState,

      newState: "ACKNOWLEDGED",

      metadata: {
        reason: "Warden acknowledged incident",
      },
    });

    sendPushToUser(incident.residentId, {
      title: "SOS Acknowledged",
      body: "Your SOS has been acknowledged by the hostel team.",
      url: "/resident/sos",
      tag: `sos-${incident.incidentId}`,
      requireInteraction: true,
    }).catch((error) => {
      console.error("Resident acknowledgement push failed:", error.message);
    });

    await incident.populate("residentId", "firstName lastName email role");

    const residentIncident = formatSafeIncident(incident, "resident");

    const wardenIncident = formatSafeIncident(incident, "warden");

    const securityIncident = formatSafeIncident(incident, "security");

    const io = req.app.get("io");

    if (io) {
      if (incident.residentId) {
        io.to(`user:${incident.residentId._id.toString()}`).emit(
          "incident:acknowledged",
          {
            incident: residentIncident,
          },
        );
      }

      io.to("role:warden").emit("incident:updated", {
        incident: wardenIncident,
      });

      io.to("role:security").emit("incident:updated", {
        incident: securityIncident,
      });
    }

    return res.json({
      success: true,

      message: "Incident acknowledged",

      incident: wardenIncident,
    });
  } catch (error) {
    console.error("Acknowledge error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to acknowledge incident",
    });
  }
};

/**
 * ---------------------------------------------------------
 * ESCALATE INCIDENT
 * ---------------------------------------------------------
 *
 * Valid transition:
 *
 * PENDING → ESCALATED
 */
const escalateIncident = async (req, res) => {
  try {
    const { reason, securityUserId } = req.body;

    const incident = await Incident.findOne({
      incidentId: req.params.incidentId,
    });

    if (!incident) {
      return res.status(404).json({
        success: false,

        message: "Incident not found",
      });
    }

    if (incident.status !== "PENDING") {
      return res.status(400).json({
        success: false,

        message: "Only pending incidents can be escalated",
      });
    }

    const normalizedReason = normalizeOptionalText(reason);

    let securityUser = null;

    if (securityUserId) {
      securityUser = await User.findOne({
        _id: securityUserId,

        role: "security",

        isActive: true,
      });

      if (!securityUser) {
        return res.status(400).json({
          success: false,

          message: "Invalid security user",
        });
      }
    }

    const previousState = incident.status;

    incident.status = "ESCALATED";

    incident.escalatedAt = new Date();

    incident.escalatedTo = securityUser ? securityUser._id : null;

    incident.escalationReason =
      normalizedReason || "Incident requires escalation";

    await incident.save();

    await createAuditLog({
      action: "INCIDENT_ESCALATED",

      actor: {
        type: "USER",

        userId: req.user._id,

        role: req.user.role,
      },

      entity: {
        type: "INCIDENT",

        entityId: incident._id,
      },

      previousState,

      newState: "ESCALATED",

      metadata: {
        reason: incident.escalationReason,
      },
    });

    sendPushToRoles(["security"], {
      title: "SOS Escalated",
      body: `Immediate attention required • ${
        incident.location?.building || "Unknown Block"
      } • Floor ${incident.location?.floor ?? "-"}`,
      url: "/security/active-sos",
      tag: `sos-${incident.incidentId}`,
      requireInteraction: true,
    }).catch((error) => {
      console.error("Security escalation push failed:", error.message);
    });

    await incident.populate("residentId", "firstName lastName email role");

    await incident.populate("escalatedTo", "firstName lastName role");

    const residentIncident = formatSafeIncident(incident, "resident");

    const wardenIncident = formatSafeIncident(incident, "warden");

    const securityIncident = formatSafeIncident(incident, "security");

    const io = req.app.get("io");

    if (io) {
      io.to("role:warden").emit("incident:escalated", {
        incident: wardenIncident,
      });

      if (securityUser) {
        io.to(`user:${securityUser._id.toString()}`).emit("incident:assigned", {
          incident: securityIncident,
        });
      }

      if (incident.residentId) {
        io.to(`user:${incident.residentId._id.toString()}`).emit(
          "incident:escalated",
          {
            incident: residentIncident,
          },
        );
      }
    }

    return res.json({
      success: true,

      message: "Incident escalated",

      incident: wardenIncident,
    });
  } catch (error) {
    console.error("Escalation error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to escalate incident",
    });
  }
};

/**
 * ---------------------------------------------------------
 * RESOLVE INCIDENT
 * ---------------------------------------------------------
 *
 * Valid transitions:
 *
 * ACKNOWLEDGED → RESOLVED
 * ESCALATED    → RESOLVED
 */
const resolveIncident = async (req, res) => {
  try {
    const { resolutionNote } = req.body;

    const incident = await Incident.findOne({
      incidentId: req.params.incidentId,
    });

    if (!incident) {
      return res.status(404).json({
        success: false,

        message: "Incident not found",
      });
    }

    if (!["ACKNOWLEDGED", "ESCALATED"].includes(incident.status)) {
      return res.status(400).json({
        success: false,

        message: `Cannot resolve incident in ${incident.status} state`,
      });
    }

    const normalizedNote = normalizeOptionalText(resolutionNote);

    const previousState = incident.status;

    incident.status = "RESOLVED";

    incident.resolvedAt = new Date();

    incident.resolvedBy = req.user._id;

    incident.resolutionNote = normalizedNote;

    await incident.save();

    await createAuditLog({
      action: "INCIDENT_RESOLVED",

      actor: {
        type: "USER",

        userId: req.user._id,

        role: req.user.role,
      },

      entity: {
        type: "INCIDENT",

        entityId: incident._id,
      },

      previousState,

      newState: "RESOLVED",

      metadata: {
        reason: normalizedNote,
      },
    });

    sendPushToUser(incident.residentId, {
      title: "SOS Resolved",
      body: "Your SOS incident has been resolved by the hostel team.",
      url: "/resident/sos",
      tag: `sos-${incident.incidentId}`,
      requireInteraction: false,
    }).catch((error) => {
      console.error("Resident resolution push failed:", error.message);
    });

    await incident.populate("residentId", "firstName lastName email role");

    await incident.populate("resolvedBy", "firstName lastName role");

    await incident.populate("escalatedTo", "firstName lastName role");

    const residentIncident = formatSafeIncident(incident, "resident");

    const wardenIncident = formatSafeIncident(incident, "warden");

    const securityIncident = formatSafeIncident(incident, "security");

    const io = req.app.get("io");

    if (io) {
      io.to("role:warden").emit("incident:resolved", {
        incident: wardenIncident,
      });

      if (incident.escalatedTo) {
        io.to(`user:${incident.escalatedTo._id.toString()}`).emit(
          "incident:resolved",
          {
            incident: securityIncident,
          },
        );
      }

      if (incident.residentId) {
        io.to(`user:${incident.residentId._id.toString()}`).emit(
          "incident:resolved",
          {
            incident: residentIncident,
          },
        );
      }
    }

    return res.json({
      success: true,

      message: "Incident resolved",

      incident: req.user.role === "warden" ? wardenIncident : securityIncident,
    });
  } catch (error) {
    console.error("Resolve error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to resolve incident",
    });
  }
};

module.exports = {
  createSOS,
  getMyIncidents,
  getIncidents,
  getIncidentById,
  acknowledgeIncident,
  escalateIncident,
  resolveIncident,
};
