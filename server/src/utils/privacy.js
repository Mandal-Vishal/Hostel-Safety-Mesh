const toPlainObject = (document) => {
  if (!document) return null;

  return typeof document.toObject === "function"
    ? document.toObject()
    : document;
};

const getUserName = (user) => {
  if (!user) return null;

  const data = toPlainObject(user);

  return [data.firstName, data.lastName].filter(Boolean).join(" ") || null;
};

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

  // Resident receives only their incident status and relevant location.
  if (role === "resident") {
    return safeIncident;
  }

  // Operational roles receive the resident's name, not email/account details.
  if (role === "warden" || role === "security") {
    safeIncident.resident = data.residentId
      ? {
          name: getUserName(data.residentId),
        }
      : null;

    safeIncident.escalationReason = data.escalationReason || null;
  }

  // Warden needs the full operational incident context.
  if (role === "warden") {
    safeIncident.acknowledgedBy = getUserName(data.acknowledgedBy);
    safeIncident.escalatedTo = getUserName(data.escalatedTo);
    safeIncident.resolvedBy = getUserName(data.resolvedBy);
    safeIncident.resolutionNote = data.resolutionNote || null;
  }

  // Security gets response-relevant details, not internal user IDs.
  if (role === "security") {
    safeIncident.escalatedTo = getUserName(data.escalatedTo);
  }

  // Unknown roles fail closed.
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
  if (!Array.isArray(incidents)) return [];

  return incidents.map((incident) => sanitizeIncident(incident, role));
};

// Keep the existing user/check-in exports used by other controllers.
const sanitizeUser = (user, options = {}) => {
  if (!user) return null;

  const data = toPlainObject(user);
  const safeUser = {
    id: data._id || data.id,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    role: data.role || null,
  };

  if (options.includeEmail && data.email) {
    safeUser.email = data.email;
  }

  if (options.includeLocation) {
    if (data.hostel) safeUser.hostel = data.hostel;
    if (data.currentZone) safeUser.currentZone = data.currentZone;
  }

  return safeUser;
};

const sanitizeUserForResident = (user) =>
  sanitizeUser(user);

const sanitizeUserForSecurity = (user) =>
  sanitizeUser(user, { includeLocation: true });

const sanitizeUserForWarden = (user) =>
  sanitizeUser(user, { includeEmail: true, includeLocation: true });

const sanitizeUserByRole = (user, role) => {
  if (role === "warden") return sanitizeUserForWarden(user);
  if (role === "security") return sanitizeUserForSecurity(user);
  return sanitizeUserForResident(user);
};

const sanitizeCheckIn = (checkIn, role) => {
  if (!checkIn) return null;

  const data = toPlainObject(checkIn);

  const safeCheckIn = {
    id: data._id || data.id,
    status: data.status || null,
    scheduledAt: data.scheduledAt || null,
    checkedInAt: data.checkedInAt || null,
    source: data.source || null,
  };

  if (role === "warden" || role === "security") {
    safeCheckIn.zone = data.zone || null;
    safeCheckIn.resident = data.residentId
      ? sanitizeUserByRole(data.residentId, role)
      : null;
  }

  return safeCheckIn;
};

const sanitizeCheckIns = (checkIns, role) => {
  if (!Array.isArray(checkIns)) return [];

  return checkIns.map((checkIn) => sanitizeCheckIn(checkIn, role));
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