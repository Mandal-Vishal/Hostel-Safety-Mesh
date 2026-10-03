import api from "./api";
import { USE_MOCK } from "./config";

import { mockZoneSummary, mockPendingResidents } from "../mock/pendingCheckins";

let mockState = {
  checkedIn: false,
  checkedInAt: null,
  zone: "Block A • Floor 2",
  withinPeriod: true,
  periodStart: "9:00 PM",
  periodEnd: "11:30 PM",
};

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

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

function getDateKeyFromISTString(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;

  return `${year}-${month}-${day}`;
}

function normalizeMyCheckIn(checkIn) {
  return {
    id: checkIn.id,
    status: checkIn.status,
    checkedIn: checkIn.status === "CHECKED_IN",
    checkedInAt: checkIn.checkedInAt,
    scheduledAt: checkIn.scheduledAt,
    zone: "Your registered zone",
    withinPeriod: null,
    periodStart: null,
    periodEnd: null,
    source: checkIn.source?.type || null,
  };
}

export async function getCurrentStatus() {
  if (USE_MOCK) {
    await delay(300);
    return { ...mockState };
  }

  const res = await api.get("/checkins/my");

  const checkIns = res.data.checkIns || [];
  const todayKey = getTodayKey();

  const current = checkIns.find(
    (item) => getDateKeyFromISTString(item.scheduledAt) === todayKey,
  );

  if (!current) {
    return {
      checkedIn: false,
      checkedInAt: null,
      scheduledAt: null,
      status: "EXPECTED",
      withinPeriod: null,
      periodStart: null,
      periodEnd: null,
      source: null,
    };
  }

  return normalizeMyCheckIn(current);
}

export async function checkIn() {
  if (USE_MOCK) {
    await delay(700);

    if (!mockState.withinPeriod) {
      throw new Error("OUTSIDE_PERIOD");
    }

    if (mockState.checkedIn) {
      throw new Error("ALREADY_CHECKED_IN");
    }

    const now = new Date();

    mockState = {
      ...mockState,
      checkedIn: true,
      checkedInAt: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    return { ...mockState };
  }

  try {
    const res = await api.post("/checkins");

    return normalizeMyCheckIn(res.data.checkIn);
  } catch (error) {
    const message = error.response?.data?.message || "";

    if (error.response?.status === 409) {
      throw new Error("ALREADY_CHECKED_IN");
    }

    if (
      error.response?.status === 400 &&
      message.toLowerCase().includes("allowed between")
    ) {
      throw new Error("OUTSIDE_PERIOD");
    }

    throw error;
  }
}

/**
 * Create tonight's EXPECTED check-in records.
 *
 * This is safe to call repeatedly because the backend
 * uses an upsert with the resident + periodKey unique key.
 */
export async function generateExpectedCheckIns() {
  if (USE_MOCK) {
    await delay(300);
    return {
      success: true,
      count: mockPendingResidents.length,
    };
  }

  const res = await api.post("/checkins/generate");

  return res.data;
}

/**
 * Fetch all operational check-ins, then keep only
 * the records belonging to today's night period.
 */
export async function getTonightCheckIns() {
  if (USE_MOCK) {
    await delay(300);

    return mockPendingResidents.map((resident, index) => ({
      id: resident.id || `MOCK-${index}`,
      status: resident.status || "EXPECTED",
      zone: resident.zone || null,
      resident: {
        id: resident.id,
        firstName: resident.name?.split(" ")[0] || "Resident",
        lastName: resident.name?.split(" ").slice(1).join(" ") || "",
      },
      scheduledAt: null,
      checkedInAt: null,
    }));
  }

  const res = await api.get("/checkins");

  const todayKey = getTodayKey();

  return (res.data.checkIns || []).filter(
    (item) => getDateKeyFromISTString(item.scheduledAt) === todayKey,
  );
}

function getResidentLocation(item) {
  return (
    item.zone || item.resident?.currentZone || item.resident?.hostel || null
  );
}

export async function getPendingSummary() {
  if (USE_MOCK) {
    await delay(300);
    return [...mockZoneSummary];
  }

  /**
   * Make sure tonight's expected records exist.
   * The backend uses upsert, so this does not create duplicates.
   */
  await generateExpectedCheckIns();

  const checkIns = await getTonightCheckIns();

  const grouped = new Map();

  for (const item of checkIns) {
    const zone = formatZone(getResidentLocation(item));

    const existing = grouped.get(zone) || {
      zone,
      expected: 0,
      checkedIn: 0,
      pending: 0,
      missed: 0,
    };

    /**
     * "Expected" means residents scheduled
     * for tonight, regardless of their current state.
     */
    existing.expected += 1;

    if (item.status === "CHECKED_IN") {
      existing.checkedIn += 1;
    }

    if (item.status === "EXPECTED") {
      existing.pending += 1;
    }

    if (item.status === "MISSED") {
      existing.missed += 1;
    }

    grouped.set(zone, existing);
  }

  return Array.from(grouped.values());
}

export async function getPendingResidents(zone) {
  if (USE_MOCK) {
    await delay(300);

    return zone
      ? mockPendingResidents.filter((r) => r.zone.startsWith(zone))
      : [...mockPendingResidents];
  }

  const checkIns = await getTonightCheckIns();

  return checkIns
    .filter((item) => item.status === "EXPECTED")
    .map((item) => {
      const location = getResidentLocation(item);

      return {
        id: item.resident?.id || item.resident?.email || item.id,

        name:
          [item.resident?.firstName, item.resident?.lastName]
            .filter(Boolean)
            .join(" ") || "Resident",

        zone: formatZone(location),

        status: item.status,
      };
    })
    .filter((resident) => !zone || resident.zone === zone);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
