/**
 * Privacy utilities
 *
 * This module controls what information is exposed outside
 * the database layer.
 *
 * IMPORTANT:
 * These functions should be used before returning database
 * documents through REST APIs or Socket.IO.
 */

/**
 * Safely convert a Mongoose document into a plain object.
 */
const toPlainObject = (document) => {
  if (!document) {
    return null;
  }

  if (typeof document.toObject === "function") {
    return document.toObject();
  }

  return { ...document };
};

/**
 * Return only the user information that is safe to expose.
 *
 * Never expose:
 * - passwordHash
 * - authentication secrets
 * - internal Mongo fields
 * - unnecessary account information
 */
const sanitizeUser = (user, options = {}) => {
  if (!user) {
    return null;
  }

  const {
    includeEmail = false,
    includeLocation = false,
  } = options;

  const data = toPlainObject(user);

  const safeUser = {
    id: data._id || data.id,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    role: data.role || null,
  };

  if (includeEmail && data.email) {
    safeUser.email = data.email;
  }

  if (includeLocation) {
    if (data.hostel) {
      safeUser.hostel = data.hostel;
    }

    if (data.currentZone) {
      safeUser.currentZone = data.currentZone;
    }
  }

  return safeUser;
};

/**
 * Resident-facing user representation.
 *
 * Residents generally don't need operational users'
 * sensitive information.
 */
const sanitizeUserForResident = (user) => {
  return sanitizeUser(user, {
    includeEmail: false,
    includeLocation: false,
  });
};

/**
 * Security-facing user representation.
 *
 * Security may need identity information during an active
 * safety response, but does not need the resident's email
 * by default.
 */
const sanitizeUserForSecurity = (user) => {
  return sanitizeUser(user, {
    includeEmail: false,
    includeLocation: true,
  });
};

/**
 * Warden-facing user representation.
 *
 * Wardens have broader operational visibility, but we still
 * avoid exposing information that is not required.
 */
const sanitizeUserForWarden = (user) => {
  return sanitizeUser(user, {
    includeEmail: true,
    includeLocation: true,
  });
};

/**
 * Return the appropriate user representation for a role.
 */
const sanitizeUserByRole = (user, role) => {
  switch (role) {
    case "warden":
      return sanitizeUserForWarden(user);

    case "security":
      return sanitizeUserForSecurity(user);

    case "resident":
      return sanitizeUserForResident(user);

    default:
      return sanitizeUser(user);
  }
};

/**
 * Sanitize an incident for external consumption.
 *
 * The database record can contain more information than the
 * client needs to receive.
 */
const sanitizeIncident = (incident, role) => {
  if (!incident) {
    return null;
  }

  const data = toPlainObject(incident);

  const safeIncident = {
    id: data._id || data.id,
    type: data.type || null,
    category: data.category || null,
    status: data.status || null,

    createdAt: data.createdAt || null,
    acknowledgedAt: data.acknowledgedAt || null,
    resolvedAt: data.resolvedAt || null,

    location: data.location || null,

    escalation: data.escalation || null,
    escalatedAt: data.escalatedAt || null,

    createdBy: null,
  };

  /*
   * Resident:
   * Only expose their own relevant identity information.
   */
  if (role === "resident") {
    if (data.residentId) {
      safeIncident.createdBy = {
        id:
          data.residentId._id ||
          data.residentId.id ||
          data.residentId,
      };
    }

    return safeIncident;
  }

  /*
   * Security:
   * Operational identity is useful during an active SOS,
   * but email is intentionally excluded.
   */
  if (role === "security") {
    if (data.residentId) {
      safeIncident.createdBy =
        typeof data.residentId === "object"
          ? sanitizeUserForSecurity(data.residentId)
          : {
              id: data.residentId,
            };
    }

    return safeIncident;
  }

  /*
   * Warden:
   * Broader operational information.
   */
  if (role === "warden") {
    if (data.residentId) {
      safeIncident.createdBy =
        typeof data.residentId === "object"
          ? sanitizeUserForWarden(data.residentId)
          : {
              id: data.residentId,
            };
    }

    return safeIncident;
  }

  /*
   * Unknown role:
   * Fail closed.
   */
  return {
    id: safeIncident.id,
    type: safeIncident.type,
    category: safeIncident.category,
    status: safeIncident.status,
    createdAt: safeIncident.createdAt,
  };
};

/**
 * Sanitize a check-in record.
 */
const sanitizeCheckIn = (checkIn, role) => {
  if (!checkIn) {
    return null;
  }

  const data = toPlainObject(checkIn);

  const safeCheckIn = {
    id: data._id || data.id,
    status: data.status || null,
    scheduledAt: data.scheduledAt || null,
    checkedInAt: data.checkedInAt || null,
    source: data.source || null,
  };

  /*
   * Location information is sensitive.
   *
   * It should only be exposed to operational roles that
   * actually require it.
   */
  if (role === "warden" || role === "security") {
    safeCheckIn.zone = data.zone || null;
  }

  /*
   * Residents should receive their own check-in information,
   * but don't need another resident's identity attached.
   */
  if (role === "resident") {
    return safeCheckIn;
  }

  /*
   * Operational roles may need to identify the resident
   * associated with a missed/active check-in.
   */
  if (
    (role === "warden" || role === "security") &&
    data.residentId
  ) {
    safeCheckIn.resident = 
      typeof data.residentId === "object"
        ? role === "warden"
          ? sanitizeUserForWarden(data.residentId)
          : sanitizeUserForSecurity(data.residentId)
        : {
            id: data.residentId,
          };
  }

  return safeCheckIn;
};

/**
 * Sanitize arrays of incidents.
 */
const sanitizeIncidents = (incidents, role) => {
  if (!Array.isArray(incidents)) {
    return [];
  }

  return incidents.map((incident) =>
    sanitizeIncident(incident, role)
  );
};

/**
 * Sanitize arrays of check-ins.
 */
const sanitizeCheckIns = (checkIns, role) => {
  if (!Array.isArray(checkIns)) {
    return [];
  }

  return checkIns.map((checkIn) =>
    sanitizeCheckIn(checkIn, role)
  );
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
};