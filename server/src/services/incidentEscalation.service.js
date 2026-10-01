const Incident = require("../models/incident.model");
const User = require("../models/user.model");
const { createAuditLog } = require("./audit.service");
const formatDateIST = require("../utils/formatDate");

const ESCALATION_TIMEOUT_MS = Number(
  process.env.SOS_ESCALATION_TIMEOUT_MS || 120000
);

const ESCALATION_INTERVAL_MS = Number(
  process.env.SOS_ESCALATION_CHECK_INTERVAL_MS || 10000
);

let escalationInterval = null;

const escalatePendingIncidents = async (io) => {
  try {
    const cutoffTime = new Date(Date.now() - ESCALATION_TIMEOUT_MS);

    const pendingIncidents = await Incident.find({
      status: "PENDING",
      createdAt: { $lte: cutoffTime },
    }).populate(
      "residentId",
      "firstName lastName email hostel currentZone"
    );

    for (const incident of pendingIncidents) {
      // Find an active security user
      const securityUser = await User.findOne({
        role: "security",
        isActive: true,
      }).select("_id firstName lastName email");

      /*
       * Even if no security user exists, we still escalate the incident.
       * Socket.IO will notify the role:security room when available.
       */
      const updatedIncident = await Incident.findOneAndUpdate(
        {
          _id: incident._id,
          status: "PENDING",
        },
        {
          $set: {
            status: "ESCALATED",
            escalatedAt: new Date(),
            escalatedTo: securityUser ? securityUser._id : null,
            escalationReason:
              "Automatic escalation due to acknowledgement timeout",
          },
        },
        {
          returnDocument: "after",
        }
      ).populate(
        "residentId",
        "firstName lastName email hostel currentZone"
      );

      // Another process may have already handled this incident
      if (!updatedIncident) {
        continue;
      }

      await createAuditLog({
        action: "INCIDENT_ESCALATED",
        actor: {
          type: "SYSTEM",
          userId: null,
          role: "SYSTEM",
        },
        entity: {
          type: "INCIDENT",
          entityId: updatedIncident._id.toString(),
        },
        previousState: "PENDING",
        newState: "ESCALATED",
        metadata: {
          reason: "Automatic escalation due to acknowledgement timeout",
          escalatedTo: securityUser
            ? securityUser._id.toString()
            : null,
          escalatedToRole: "SECURITY",
        },
      });

      const incidentPayload = {
        incidentId: updatedIncident.incidentId,
        type: updatedIncident.type,
        status: updatedIncident.status,

        source: updatedIncident.source,

        location: updatedIncident.location,

        resident: updatedIncident.residentId
          ? {
              id: updatedIncident.residentId._id,
              name: `${updatedIncident.residentId.firstName} ${updatedIncident.residentId.lastName}`,
            }
          : null,

        createdAt: formatDateIST(updatedIncident.createdAt),
        escalatedAt: formatDateIST(updatedIncident.escalatedAt),

        escalatedTo: securityUser
          ? {
              id: securityUser._id,
              name: `${securityUser.firstName} ${securityUser.lastName}`,
              email: securityUser.email,
            }
          : null,

        escalatedToRole: "SECURITY",

        escalationReason: updatedIncident.escalationReason,
      };

      // Notify all wardens
      io.to("role:warden").emit(
        "incident:escalated",
        incidentPayload
      );

      // Notify all security users
      io.to("role:security").emit(
        "incident:escalated",
        incidentPayload
      );

      // Notify resident
      if (updatedIncident.residentId?._id) {
        io.to(
          `user:${updatedIncident.residentId._id.toString()}`
        ).emit(
          "incident:escalated",
          incidentPayload
        );
      }

      console.log(
        `Incident ${updatedIncident.incidentId} automatically escalated at ${formatDateIST(
          updatedIncident.escalatedAt
        )}`
      );
    }
  } catch (error) {
    console.error(
      "Incident escalation service error:",
      error
    );
  }
};

const startIncidentEscalationService = (io) => {
  if (escalationInterval) {
    return;
  }

  console.log(
    `Incident escalation service started. Timeout: ${ESCALATION_TIMEOUT_MS} ms`
  );

  escalatePendingIncidents(io);

  escalationInterval = setInterval(() => {
    escalatePendingIncidents(io);
  }, ESCALATION_INTERVAL_MS);
};

const stopIncidentEscalationService = () => {
  if (escalationInterval) {
    clearInterval(escalationInterval);
    escalationInterval = null;
  }
};

module.exports = {
  startIncidentEscalationService,
  stopIncidentEscalationService,
  escalatePendingIncidents,
};