import api from "./api";
import { USE_MOCK } from "./config";

let mockIncidents = [
  {
    id: "INC-1024",
    type: "SOS",
    zone: "Block A • Floor 2",
    status: "RESOLVED",
    date: "September 27",
  },
];

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

function normalizeStatus(status) {
  if (status === "PENDING") return "OPEN";
  if (status === "ACKNOWLEDGED") return "INVESTIGATING";
  if (status === "ESCALATED") return "INVESTIGATING";

  return status;
}

function normalizeIncident(incident) {
  return {
    ...incident,

    id: incident.incidentId,

    zone: formatZone(incident.location),

    status: normalizeStatus(incident.status),

    backendStatus: incident.status,

    date: incident.createdAt,

    description: incident.resolutionNote || null,
  };
}

export async function getMyIncidents() {
  if (USE_MOCK) {
    await delay(300);
    return [...mockIncidents];
  }

  const res = await api.get("/incidents/my");

  return (res.data.incidents || []).map(normalizeIncident);
}

export async function getIncidents() {
  if (USE_MOCK) {
    await delay(300);
    return [...mockIncidents];
  }

  const res = await api.get("/incidents");

  return (res.data.incidents || []).map(normalizeIncident);
}

export async function getIncidentDetails(id) {
  if (USE_MOCK) {
    await delay(300);
    return mockIncidents.find((i) => i.id === id) || null;
  }

  const res = await api.get(`/incidents/${id}`);

  return res.data.incident ? normalizeIncident(res.data.incident) : null;
}

export async function updateIncident(id, updates) {
  if (USE_MOCK) {
    await delay(400);

    mockIncidents = mockIncidents.map((incident) =>
      incident.id === id ? { ...incident, ...updates } : incident,
    );

    return mockIncidents.find((incident) => incident.id === id);
  }

  const status = updates?.status;

  if (status === "ACKNOWLEDGED") {
    const res = await api.patch(`/incidents/${id}/acknowledge`);
    return normalizeIncident(res.data.incident);
  }

  if (status === "ESCALATED") {
    const res = await api.patch(`/incidents/${id}/escalate`, {
      reason: updates.reason,
      securityUserId: updates.securityUserId,
    });

    return normalizeIncident(res.data.incident);
  }

  if (status === "RESOLVED") {
    const res = await api.patch(`/incidents/${id}/resolve`, {
      resolutionNote: updates.resolutionNote,
    });

    return normalizeIncident(res.data.incident);
  }

  throw new Error(`Unsupported incident update: ${status}`);
}

export function getMockTimeline(incident) {
  const events = [
    {
      label: "Incident reported",
      time: incident.createdAt || incident.date,
    },
  ];

  if (incident.acknowledgedAt) {
    events.push({
      label: "Incident acknowledged",
      time: incident.acknowledgedAt,
    });
  }

  if (incident.escalatedAt) {
    events.push({
      label: "Incident escalated",
      time: incident.escalatedAt,
    });
  }

  if (incident.resolvedAt) {
    events.push({
      label: "Incident resolved",
      time: incident.resolvedAt,
    });
  }

  return events;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
