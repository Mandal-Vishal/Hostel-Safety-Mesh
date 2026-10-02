const Incident = require("../models/incident.model");
const User = require("../models/user.model");

const { createAuditLog } = require("./audit.service");

const formatDateIST = require("../utils/formatDate");

const { sanitizeIncident } = require("../utils/privacy");

const ESCALATION_TIMEOUT_MS = Number(
  process.env.SOS_ESCALATION_TIMEOUT_MS || 120000,
);

const ESCALATION_INTERVAL_MS = Number(
  process.env.SOS_ESCALATION_CHECK_INTERVAL_MS || 10000,
);

let escalationInterval = null;

/**
 * Prevent overlapping escalation scans.
 *
 * setInterval() does not wait for an async function
 * to finish before starting the next invocation.
 *
 * Without this guard, a slow database operation could
 * cause multiple scans to run at the same time.
 */
let escalationScanRunning = false;

/**
 * Apply the project's date formatting after
 * privacy filtering.
 */
const formatSanitizedIncident = (incident, role) => {
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

const escalatePendingIncidents = async (io) => {
  /**
   * Do not allow overlapping scans.
   */
  if (escalationScanRunning) {
    return;
  }

  escalationScanRunning = true;

  try {
    const cutoffTime = new Date(Date.now() - ESCALATION_TIMEOUT_MS);

    /**
     * Only PENDING incidents older than
     * the acknowledgement timeout are candidates.
     */
    const pendingIncidents = await Incident.find({
      status: "PENDING",

      createdAt: {
        $lte: cutoffTime,
      },
    }).populate("residentId", "firstName lastName role");

    if (pendingIncidents.length === 0) {
      return;
    }

    /**
     * Find an active security user once
     * for this scan instead of querying for
     * every incident.
     *
     * We intentionally do not retrieve email
     * because the escalation service does not
     * need it.
     */
    const securityUser = await User.findOne({
      role: "security",

      isActive: true,
    }).select("_id firstName lastName role");

    for (const incident of pendingIncidents) {
      /**
       * IMPORTANT:
       *
       * The status condition makes escalation
       * atomic.
       *
       * If another worker/manual action changes
       * this incident before this update runs,
       * findOneAndUpdate() returns null and this
       * service does nothing.
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

          runValidators: true,
        },
      )
        .populate("residentId", "firstName lastName role")
        .populate("escalatedTo", "firstName lastName role");

      /**
       * Another request/process already handled
       * this incident.
       */
      if (!updatedIncident) {
        continue;
      }

      /**
       * Record automatic escalation in the
       * tamper-evident audit chain.
       */
      await createAuditLog({
        action: "INCIDENT_ESCALATED",

        actor: {
          type: "SYSTEM",

          userId: null,

          role: "SYSTEM",
        },

        entity: {
          type: "INCIDENT",

          entityId: updatedIncident._id,
        },

        previousState: "PENDING",

        newState: "ESCALATED",

        metadata: {
          reason: "Automatic escalation due to acknowledgement timeout",

          escalatedTo: securityUser ? securityUser._id.toString() : null,

          escalatedToRole: "SECURITY",
        },
      });

      /**
       * Each role receives its own
       * privacy-filtered representation.
       */
      const wardenIncident = formatSanitizedIncident(updatedIncident, "warden");

      const securityIncident = formatSanitizedIncident(
        updatedIncident,
        "security",
      );

      const residentIncident = formatSanitizedIncident(
        updatedIncident,
        "resident",
      );

      if (io) {
        /**
         * Warden receives operational
         * escalation information.
         */
        io.to("role:warden").emit("incident:escalated", {
          incident: wardenIncident,
        });

        /**
         * Security receives only its
         * privacy-filtered representation.
         */
        io.to("role:security").emit("incident:escalated", {
          incident: securityIncident,
        });

        /**
         * Resident receives their own
         * privacy-filtered incident.
         */
        if (updatedIncident.residentId?._id) {
          io.to(`user:${updatedIncident.residentId._id.toString()}`).emit(
            "incident:escalated",
            {
              incident: residentIncident,
            },
          );
        }
      }

      console.log(
        `Incident ${
          updatedIncident.incidentId
        } automatically escalated at ${formatDateIST(
          updatedIncident.escalatedAt,
        )}`,
      );
    }
  } catch (error) {
    console.error("Incident escalation service error:", error);
  } finally {
    /**
     * Always release the scan lock,
     * including when a database error occurs.
     */
    escalationScanRunning = false;
  }
};

const startIncidentEscalationService = (io) => {
  /**
   * Prevent duplicate intervals if
   * initialization is accidentally called
   * more than once.
   */
  if (escalationInterval) {
    return;
  }

  console.log(
    `Incident escalation service started. Timeout: ${ESCALATION_TIMEOUT_MS} ms`,
  );

  /**
   * Run once immediately on startup.
   */
  escalatePendingIncidents(io);

  /**
   * Continue checking periodically.
   */
  escalationInterval = setInterval(() => {
    escalatePendingIncidents(io);
  }, ESCALATION_INTERVAL_MS);
};

const stopIncidentEscalationService = () => {
  if (escalationInterval) {
    clearInterval(escalationInterval);

    escalationInterval = null;
  }

  /**
   * Reset the scan lock as well so the
   * service can be started again cleanly.
   */
  escalationScanRunning = false;
};

module.exports = {
  startIncidentEscalationService,
  stopIncidentEscalationService,
  escalatePendingIncidents,
};
