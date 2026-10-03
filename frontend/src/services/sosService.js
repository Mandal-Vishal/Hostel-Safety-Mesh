import { mockSocket } from "./mockSocket";
import api from "./api";
import { USE_MOCK } from "./config";

let mockSOSState = null;

function formatZone(location) {
  if (!location) return "Location unavailable";

  const parts = [];

  if (location.building) {
    parts.push(location.building);
  }

  if (location.floor !== null && location.floor !== undefined) {
    parts.push(`Floor ${location.floor}`);
  }

  if (location.zone) {
    parts.push(location.zone);
  }

  return parts.join(" • ") || "Location unavailable";
}

function normalizeIncident(incident) {
  return {
    ...incident,

    id: incident.incidentId,

    zone: formatZone(incident.location),

    triggeredAt: incident.createdAt,

    escalated: incident.status === "ESCALATED" || Boolean(incident.escalatedAt),
  };
}

function extractIncident(res) {
  return res.data?.incident ? normalizeIncident(res.data.incident) : null;
}

export async function getActiveSOS() {
  if (USE_MOCK) {
    await delay(300);
    return mockSOSState ? { ...mockSOSState } : null;
  }

  const res = await api.get("/incidents/my");
  const incidents = res.data.incidents || [];

  const active = incidents.find((incident) => incident.status !== "RESOLVED");

  return active ? normalizeIncident(active) : null;
}

export async function getAllActiveSOS() {
  if (USE_MOCK) {
    await delay(300);
    return mockSOSState ? [{ ...mockSOSState }] : [];
  }

  const res = await api.get("/incidents");

  return (res.data.incidents || [])
    .filter((incident) => incident.status !== "RESOLVED")
    .map(normalizeIncident);
}

export async function acknowledgeSOS(id) {
  if (USE_MOCK) {
    await delay(500);

    if (mockSOSState && mockSOSState.id === id) {
      mockSOSState = {
        ...mockSOSState,
        status: "ACKNOWLEDGED",
      };

      mockSocket._emit("sos:acknowledged", mockSOSState);
    }

    return { ...mockSOSState };
  }

  const res = await api.patch(`/incidents/${id}/acknowledge`);

  return extractIncident(res);
}

export async function createSOS() {
  if (USE_MOCK) {
    await delay(600);

    const now = new Date();

    mockSOSState = {
      id: "SOS-1024",
      status: "TRIGGERED",
      zone: "Block A • Floor 2",
      triggeredAt: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    return { ...mockSOSState };
  }

  const res = await api.post("/incidents/sos");

  return extractIncident(res);
}

export async function getSOSDetails(id) {
  if (USE_MOCK) {
    await delay(300);
    return mockSOSState ? { ...mockSOSState } : null;
  }

  const res = await api.get(`/incidents/${id}`);

  return extractIncident(res);
}

export async function updateSOSStatus(id, status, options = {}) {
  if (USE_MOCK) {
    await delay(500);

    if (mockSOSState && mockSOSState.id === id) {
      mockSOSState = {
        ...mockSOSState,
        status,
      };

      mockSocket._emit("sos:acknowledged", mockSOSState);
    }

    return { ...mockSOSState };
  }

  if (status === "ACKNOWLEDGED") {
    const res = await api.patch(`/incidents/${id}/acknowledge`);
    return extractIncident(res);
  }

  if (status === "ESCALATED") {
    const res = await api.patch(`/incidents/${id}/escalate`, {
      reason: options.reason,
      securityUserId: options.securityUserId,
    });

    return extractIncident(res);
  }

  if (status === "RESOLVED") {
    const res = await api.patch(`/incidents/${id}/resolve`, {
      resolutionNote: options.resolutionNote,
    });

    return extractIncident(res);
  }

  throw new Error(`Unsupported SOS status: ${status}`);
}

export async function escalateSOS(id, reason) {
  if (USE_MOCK) {
    await delay(300);

    if (mockSOSState && mockSOSState.id === id) {
      mockSOSState = {
        ...mockSOSState,
        status: "ESCALATED",
        escalated: true,
      };

      mockSocket._emit("sos:escalated", mockSOSState);
    }

    return { ...mockSOSState };
  }

  const res = await api.patch(`/incidents/${id}/escalate`, {
    reason,
  });

  return extractIncident(res);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
