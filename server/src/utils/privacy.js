const toPlainObject = (document) => {
  if (!document) return null;

  return typeof document.toObject === "function"
    ? document.toObject()
    : document;
};

const getId = (value) => {
  if (!value) return null;

  if (typeof value === "object" && value._id) {
    return value._id;
  }

  return value;
};

const getUserName = (user) => {
  if (!user) return null;

  const data = toPlainObject(user);

  return [data.firstName, data.lastName].filter(Boolean).join(" ") || null;
};

/**
 * ---------------------------------------------------------
 * USER PRIVACY
 * ---------------------------------------------------------
 *
 * The database contains more information than every role
 * needs to receive.
 *
 * Resident:
 *   - identity only
 *   - no email
 *   - no location
 *
 * Security:
 *   - identity
 *   - operational location
 *   - no email
 *
 * Warden:
 *   - identity
 *   - email
 *   - operational location
 *
 * passwordHash is NEVER returned by any projection.
 */

const sanitizeUser = (user, options = {}) => {
  if (!user) return null;

  const data = toPlainObject(user);

  const safeUser = {
    id: data._id || data.id || null,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    role: data.role || null,
  };

  if (options.includeEmail && data.email) {
    safeUser.email = data.email;
  }

  if (options.includeLocation) {
    if (data.hostel) {
      safeUser.hostel = {
        building: data.hostel.building || null,
        floor: data.hostel.floor ?? null,
        room: data.hostel.room || null,
        zone: data.hostel.zone || null,
      };
    }

    if (data.currentZone) {
      safeUser.currentZone = {
        building: data.currentZone.building || null,
        floor: data.currentZone.floor ?? null,
        zone: data.currentZone.zone || null,
        updatedAt: data.currentZone.updatedAt || null,
      };
    }
  }

  return safeUser;
};

const sanitizeUserForResident = (user) => {
  return sanitizeUser(user);
};

const sanitizeUserForSecurity = (user) => {
  return sanitizeUser(user, {
    includeLocation: true,
  });
};

const sanitizeUserForWarden = (user) => {
  return sanitizeUser(user, {
    includeEmail: true,
    includeLocation: true,
  });
};

const sanitizeUserByRole = (user, role) => {
  switch (role) {
    case "admin":
      return sanitizeUser(user, {
        includeEmail: true,
        includeLocation: true,
      });
    case "warden":
      return sanitizeUserForWarden(user);

    case "security":
      return sanitizeUserForSecurity(user);

    case "resident":
      return sanitizeUserForResident(user);

    default:
      return sanitizeUserForResident(user);
  }
};

/**
 * ---------------------------------------------------------
 * INCIDENT PRIVACY
 * ---------------------------------------------------------
 */

const sanitizeIncident = (incident, role) => {
  if (!incident) return null;

  const data = toPlainObject(incident);

  const safeIncident = {
    incidentId: data.incidentId || null,

    type: data.type || null,

    status: data.status || null,

    location: data.location
      ? {
          building: data.location.building || null,
          floor: data.location.floor ?? null,
          zone: data.location.zone || null,
        }
      : null,

    source: {
      type: data.source?.type || null,
    },

    createdAt: data.createdAt || null,

    updatedAt: data.updatedAt || null,

    acknowledgedAt: data.acknowledgedAt || null,

    escalatedAt: data.escalatedAt || null,

    resolvedAt: data.resolvedAt || null,
  };

  /**
   * Resident receives only information required
   * to understand their own SOS.
   *
   * No:
   * - residentId
   * - email
   * - acknowledgedBy
   * - escalatedTo
   * - resolvedBy
   * - escalationReason
   */
  if (role === "resident") {
    return safeIncident;
  }

  /**
   * Security and warden need to know which resident
   * requires assistance, but do not need the resident's
   * account information.
   */
  if (role === "warden" || role === "security") {
    safeIncident.resident = data.residentId
      ? {
          name: getUserName(data.residentId),
        }
      : null;

    safeIncident.escalationReason = data.escalationReason || null;
  }

  /**
   * Warden gets the full operational incident context.
   */
  if (role === "warden") {
    safeIncident.acknowledgedBy = getUserName(data.acknowledgedBy);

    safeIncident.escalatedTo = getUserName(data.escalatedTo);

    safeIncident.resolvedBy = getUserName(data.resolvedBy);

    safeIncident.resolutionNote = data.resolutionNote || null;
  }

  /**
   * Security only needs the person/team the incident
   * was escalated to.
   */
  if (role === "security") {
    safeIncident.escalatedTo = getUserName(data.escalatedTo);
  }

  /**
   * Fail closed for unknown roles.
   */
  if (!["resident", "warden", "security"].includes(role)) {
    return {
      incidentId: safeIncident.incidentId,
      type: safeIncident.type,
      status: safeIncident.status,
      createdAt: safeIncident.createdAt,
    };
  }

  return safeIncident;
};

const sanitizeIncidents = (incidents, role) => {
  if (!Array.isArray(incidents)) {
    return [];
  }

  return incidents.map((incident) => sanitizeIncident(incident, role));
};

/**
 * ---------------------------------------------------------
 * CHECK-IN PRIVACY
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * source.nodeId is intentionally NOT returned by default.
 *
 * A resident only needs to know that their check-in came
 * from the resident app or an IoT node.
 *
 * Operational node identifiers are internal infrastructure
 * information.
 */

const sanitizeCheckIn = (checkIn, role) => {
  if (!checkIn) return null;

  const data = toPlainObject(checkIn);

  const safeCheckIn = {
    id: data._id || data.id || null,

    status: data.status || null,

    scheduledAt: data.scheduledAt || null,

    checkedInAt: data.checkedInAt || null,

    source: {
      type: data.source?.type || null,
    },
  };

  /**
   * Warden/security need operational zone information.
   */
  if (role === "warden" || role === "security") {
    safeCheckIn.zone = data.zone
      ? {
          building: data.zone.building || null,
          floor: data.zone.floor ?? null,
          zone: data.zone.zone || null,
        }
      : null;

    safeCheckIn.resident = data.residentId
      ? sanitizeUserByRole(data.residentId, role)
      : null;
  }

  return safeCheckIn;
};

const sanitizeCheckIns = (checkIns, role) => {
  if (!Array.isArray(checkIns)) {
    return [];
  }

  return checkIns.map((checkIn) => sanitizeCheckIn(checkIn, role));
};

/**
 * ---------------------------------------------------------
 * NODE PRIVACY
 * ---------------------------------------------------------
 *
 * Nodes contain infrastructure information.
 *
 * Only expose information useful for operational monitoring.
 * Internal credentials/configuration fields must never be
 * serialized directly.
 */

const sanitizeNode = (node, role) => {
  if (!node) return null;

  const data = toPlainObject(node);

  const safeNode = {
    nodeId: data.nodeId || null,

    name: data.name || null,

    type: data.type || null,

    status: data.status || null,

    isActive: typeof data.isActive === "boolean" ? data.isActive : null,

    location: data.location
      ? {
          building: data.location.building || null,
          floor: data.location.floor ?? null,
          zone: data.location.zone || null,
        }
      : null,

    health: data.health
      ? {
          status: data.health.status || null,
          lastHeartbeatAt: data.health.lastHeartbeatAt || null,
          batteryLevel: data.health.batteryLevel ?? null,
        }
      : null,

    createdAt: data.createdAt || null,

    updatedAt: data.updatedAt || null,
  };

  /**
   * Only recognized operational roles receive the
   * full operational node projection.
   */
  if (role === "warden" || role === "security") {
    return safeNode;
  }

  /**
   * Unknown/resident roles fail closed.
   */
  return {
    nodeId: safeNode.nodeId,
    name: safeNode.name,
    status: safeNode.status,
  };
};

const sanitizeNodes = (nodes, role) => {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes.map((node) => sanitizeNode(node, role));
};

/**
 * ---------------------------------------------------------
 * AUDIT LOG PRIVACY
 * ---------------------------------------------------------
 */

const sanitizeAuditLog = (log) => {
  if (!log) return null;

  const data = toPlainObject(log);

  const actor = data.actor?.userId
    ? {
        id: getId(data.actor.userId),
        name: getUserName(data.actor.userId),
        role: data.actor.role || data.actor.userId?.role || null,
      }
    : {
        id: null,
        name: null,
        role: data.actor?.role || null,
      };

  return {
    id: data._id || data.id || null,

    action: data.action || null,

    actor,

    entity: data.entity
      ? {
          type: data.entity.type || null,
          entityId: data.entity.entityId || null,
        }
      : null,

    previousState: data.previousState || null,

    newState: data.newState || null,

    metadata:
      data.metadata && typeof data.metadata === "object" ? data.metadata : {},

    timestamp: data.timestamp || null,

    hash: data.hash || null,

    previousHash: data.previousHash || null,

    signature: data.signature || null,
  };
};

const sanitizeAuditLogs = (logs) => {
  if (!Array.isArray(logs)) {
    return [];
  }

  return logs.map(sanitizeAuditLog);
};

module.exports = {
  toPlainObject,

  sanitizeUser,
  sanitizeUserForResident,
  sanitizeUserForSecurity,
  sanitizeUserForWarden,
  sanitizeUserByRole,

  sanitizeIncident,
  sanitizeIncidents,

  sanitizeCheckIn,
  sanitizeCheckIns,

  sanitizeNode,
  sanitizeNodes,

  sanitizeAuditLog,
  sanitizeAuditLogs,
};
