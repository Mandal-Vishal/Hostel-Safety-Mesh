import { mockNotifications } from "../mock/notifications";
import { USE_MOCK } from "./config";

let mockState = [...mockNotifications];

export async function getNotifications() {
  if (USE_MOCK) {
    await delay(300);
    return [...mockState];
  }

  // The current backend does not persist notifications yet.
  // Return an empty list instead of calling a non-existent API.
  return [];
}

export async function markAsRead(id) {
  if (USE_MOCK) {
    await delay(200);

    mockState = mockState.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    );

    return [...mockState];
  }

  // No notification persistence endpoint exists in the current backend.
  return [];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
