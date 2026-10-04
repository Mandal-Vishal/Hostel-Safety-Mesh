import api from "./api";
import { mockNotifications } from "../mock/notifications";
import { USE_MOCK } from "./config";

const MAX_NOTIFICATIONS = 50;

function getNotificationKey(userKey) {
  return `hostel-safety-mesh-notifications-${userKey || "default"}`;
}

function getSnapshotKey(userKey) {
  return `hostel-safety-mesh-incident-snapshot-${userKey || "default"}`;
}

function readNotifications(userKey) {
  try {
    const raw = localStorage.getItem(getNotificationKey(userKey));

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotifications(userKey, notifications) {
  localStorage.setItem(
    getNotificationKey(userKey),
    JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)),
  );
}

function readSnapshot(userKey) {
  try {
    const raw = localStorage.getItem(getSnapshotKey(userKey));

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveSnapshot(userKey, snapshot) {
  localStorage.setItem(getSnapshotKey(userKey), JSON.stringify(snapshot));
}

export async function getNotifications(userKey = "default") {
  if (USE_MOCK) {
    return [...mockNotifications];
  }

  return readNotifications(userKey);
}

export async function markAsRead(id, userKey = "default") {
  if (USE_MOCK) {
    return mockNotifications.map((notification) =>
      String(notification.id) === String(id)
        ? { ...notification, read: true }
        : notification,
    );
  }

  const notifications = readNotifications(userKey);

  const updated = notifications.map((notification) =>
    String(notification.id) === String(id)
      ? { ...notification, read: true }
      : notification,
  );

  saveNotifications(userKey, updated);

  return updated;
}

export async function markAllAsRead(userKey = "default") {
  const notifications = readNotifications(userKey);

  const updated = notifications.map((notification) => ({
    ...notification,
    read: true,
  }));

  saveNotifications(userKey, updated);

  return updated;
}

export async function addNotification(notification, userKey = "default") {
  const current = readNotifications(userKey);

  if (
    notification.dedupeKey &&
    current.some((item) => item.dedupeKey === notification.dedupeKey)
  ) {
    return current;
  }

  const next = [
    {
      ...notification,

      id:
        notification.id ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

      read: false,

      createdAt: notification.createdAt || new Date().toISOString(),
    },
    ...current,
  ].slice(0, MAX_NOTIFICATIONS);

  saveNotifications(userKey, next);

  return next;
}

/**
 * Check the real incident API for new or changed
 * SOS records and create notifications.
 *
 * This does not depend on Socket.IO, so the navbar
 * continues working even when socket events are unavailable.
 */
export async function syncIncidentNotifications(user) {
  if (USE_MOCK || !user) {
    return getNotifications(user?.id || "default");
  }

  const role = user.role;
  const userKey = user._id || user.id || user.email || "default";

  let response;

  if (role === "resident") {
    response = await api.get("/incidents/my");
  } else if (role === "warden" || role === "security") {
    response = await api.get("/incidents");
  } else {
    return getNotifications(userKey);
  }

  const incidents = response.data?.incidents || [];

  const previousSnapshot = readSnapshot(userKey);

  const currentSnapshot = {};

  let notifications = readNotifications(userKey);

  for (const incident of incidents) {
    const incidentId = incident.incidentId || incident.id || incident._id;

    if (!incidentId) {
      continue;
    }

    const status = incident.status || "PENDING";

    const updatedAt =
      incident.updatedAt ||
      incident.resolvedAt ||
      incident.escalatedAt ||
      incident.acknowledgedAt ||
      incident.createdAt ||
      "";

    const snapshotKey = `${incidentId}`;

    currentSnapshot[snapshotKey] = {
      status,
      updatedAt,
    };

    const previous = previousSnapshot[snapshotKey];

    // First sync only establishes the baseline.
    // This prevents old test incidents from generating
    // dozens of notifications on first load.
    if (!previous) {
      continue;
    }

    const statusChanged = previous.status !== status;
    const timeChanged = previous.updatedAt !== updatedAt;

    if (!statusChanged && !timeChanged) {
      continue;
    }

    const location = formatLocation(incident.location);

    let notification = null;

    if (statusChanged && status === "PENDING") {
      notification = {
        type: "sos",
        title: role === "resident" ? "SOS Submitted" : "New SOS Alert",
        detail:
          role === "resident"
            ? location
              ? `Your SOS was submitted • ${location}`
              : "Your SOS was submitted successfully."
            : location
              ? `${location} requires attention`
              : "A new SOS alert requires attention.",
        time: "Just now",
      };
    }

    if (statusChanged && status === "ACKNOWLEDGED") {
      notification = {
        type: "success",
        title: "SOS Acknowledged",
        detail:
          role === "resident"
            ? "The hostel safety team has acknowledged your SOS."
            : `Incident ${incidentId} was acknowledged.`,
        time: "Just now",
      };
    }

    if (statusChanged && status === "ESCALATED") {
      notification = {
        type: "warning",
        title: "SOS Escalated",
        detail:
          role === "resident"
            ? "Your SOS has been escalated to security."
            : `Incident ${incidentId} has been escalated to security.`,
        time: "Just now",
      };
    }

    if (statusChanged && status === "RESOLVED") {
      notification = {
        type: "success",
        title: "Incident Resolved",
        detail:
          role === "resident"
            ? "Your SOS incident has been resolved."
            : `Incident ${incidentId} has been resolved.`,
        time: "Just now",
      };
    }

    if (!notification) {
      continue;
    }

    notification.dedupeKey = `${incidentId}-${status}-${updatedAt}`;

    notifications = await addNotification(notification, userKey);
  }

  saveSnapshot(userKey, currentSnapshot);
  saveNotifications(userKey, notifications);

  return notifications;
}

function formatLocation(location) {
  if (!location) {
    return "";
  }

  return [
    location.building,
    location.floor !== null && location.floor !== undefined
      ? `Floor ${location.floor}`
      : null,
    location.room ? `Room ${location.room}` : null,
    location.zone,
  ]
    .filter(Boolean)
    .join(" • ");
}
