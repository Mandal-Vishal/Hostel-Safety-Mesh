import api from "./api";
import { USE_MOCK } from "./config";
import { mockWardenStats } from "../mock/wardenStats";

export async function getStats() {
  if (USE_MOCK) {
    await delay(400);
    return { ...mockWardenStats };
  }

  const res = await api.get("/analytics", {
    params: { days: 7 },
  });

  const data = res.data.data;

  return {
    activeSOS:
      (data.incidents?.pending || 0) +
      (data.incidents?.acknowledged || 0) +
      (data.incidents?.escalated || 0),

    checkIns: data.checkIns?.checkedIn || 0,

    incidents: data.totalIncidents || 0,

    avgResponse:
      data.avgResponse || data.response?.averageAcknowledgement || "—",
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
