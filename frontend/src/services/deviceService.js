import api from "./api";
import { USE_MOCK } from "./config";
import { mockDevices } from "../mock/devices";

function formatZone(location) {
  if (!location) return "Unassigned";

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

  return parts.join(" • ") || "Unassigned";
}

function normalizeNode(node) {
  return {
    ...node,
    id: node.nodeId,
    zone: formatZone(node.location),
  };
}

export async function getDevices() {
  if (USE_MOCK) {
    await delay(300);
    return [...mockDevices];
  }

  const res = await api.get("/nodes");

  return (res.data.nodes || []).map(normalizeNode);
}

export async function getDeviceStatus(id) {
  if (USE_MOCK) {
    await delay(300);
    return mockDevices.find((d) => d.id === id) || null;
  }

  const res = await api.get(`/nodes/${id}`);

  return res.data.node ? normalizeNode(res.data.node) : null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
