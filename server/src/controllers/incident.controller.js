const Incident = require("../models/incident.model");
const User = require("../models/user.model");
const formatDateIST = require("../utils/formatDate");

const generateIncidentId = () => {
  return `INC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
};

const formatIncident = (incident) => {
  const data = incident.toObject ? incident.toObject() : incident;

  return {
    ...data,

    createdAt: formatDateIST(data.createdAt),
    updatedAt: formatDateIST(data.updatedAt),

    acknowledgedAt: formatDateIST(data.acknowledgedAt),
    escalatedAt: formatDateIST(data.escalatedAt),
    resolvedAt: formatDateIST(data.resolvedAt),
  };
};

// Resident creates SOS
const createSOS = async (req, res) => {
  try {
    const { currentZone } = req.body;

    const location =
      currentZone ||
      req.user.currentZone ||
      req.user.hostel ||
      {};

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

    res.status(201).json({
      success: true,
      message: "SOS received successfully",
      incident: formatIncident(incident),
    });
  } catch (error) {
    console.error("Create SOS error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create SOS",
    });
  }
};

// Resident sees own incidents
const getMyIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({
      residentId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      incidents: incidents.map(formatIncident),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch incidents",
    });
  }
};

// Warden/security view incidents
const getIncidents = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const incidents = await Incident.find(filter)
      .populate(
        "residentId",
        "firstName lastName email hostel currentZone"
      )
      .populate("acknowledgedBy", "firstName lastName role")
      .populate("escalatedTo", "firstName lastName role")
      .populate("resolvedBy", "firstName lastName role")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      incidents: incidents.map(formatIncident),
    });
  } catch (error) {
    console.error("Get incidents error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch incidents",
    });
  }
};

// Get one incident
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findOne({
      incidentId: req.params.incidentId,
    })
      .populate(
        "residentId",
        "firstName lastName email hostel currentZone"
      )
      .populate("acknowledgedBy", "firstName lastName role")
      .populate("escalatedTo", "firstName lastName role")
      .populate("resolvedBy", "firstName lastName role");

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    if (
      req.user.role === "resident" &&
      incident.residentId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      incident: formatIncident(incident),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch incident",
    });
  }
};

// Warden acknowledges
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

    if (!["PENDING", "ESCALATED"].includes(incident.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot acknowledge incident in ${incident.status} state`,
      });
    }

    incident.status = "ACKNOWLEDGED";

    // Store Date object, NOT formatted string
    incident.acknowledgedAt = new Date();

    incident.acknowledgedBy = req.user._id;

    await incident.save();

    res.json({
      success: true,
      message: "Incident acknowledged",
      incident: formatIncident(incident),
    });
  } catch (error) {
    console.error("Acknowledge error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to acknowledge incident",
    });
  }
};

// Warden escalates
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

    incident.status = "ESCALATED";

    // Store Date object
    incident.escalatedAt = new Date();

    incident.escalatedTo = securityUser?._id || null;

    incident.escalationReason =
      reason || "Incident requires escalation";

    await incident.save();

    res.json({
      success: true,
      message: "Incident escalated",
      incident: formatIncident(incident),
    });
  } catch (error) {
    console.error("Escalation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to escalate incident",
    });
  }
};

// Warden/security resolves
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

    incident.status = "RESOLVED";

    // Store Date object
    incident.resolvedAt = new Date();

    incident.resolvedBy = req.user._id;
    incident.resolutionNote = resolutionNote || null;

    await incident.save();

    res.json({
      success: true,
      message: "Incident resolved",
      incident: formatIncident(incident),
    });
  } catch (error) {
    console.error("Resolve error:", error);

    res.status(500).json({
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