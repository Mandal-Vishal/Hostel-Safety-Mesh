import api from "./api";

const SERVICE_WORKER_PATH = "/sw.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (
    base64String +
    padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  );
}

export async function enablePushNotifications() {
  try {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers are not supported.");
      return false;
    }

    if (!("PushManager" in window)) {
      console.warn("Push notifications are not supported.");
      return false;
    }

    if (!("Notification" in window)) {
      console.warn("Browser notifications are not supported.");
      return false;
    }

    if (!window.isSecureContext) {
      console.warn(
        "Push notifications require HTTPS or localhost."
      );
      return false;
    }

    // Ask permission only when needed
    if (Notification.permission === "denied") {
      console.warn(
        "Notification permission was denied."
      );
      return false;
    }

    if (Notification.permission === "default") {
      const permission =
        await Notification.requestPermission();

      if (permission !== "granted") {
        console.warn(
          "Notification permission was not granted."
        );
        return false;
      }
    }

    // Register service worker
    const registration =
      await navigator.serviceWorker.register(
        SERVICE_WORKER_PATH
      );

    await navigator.serviceWorker.ready;

    // Get VAPID public key
    const response = await api.get(
      "/notifications/push/public-key"
    );

    const publicKey = response.data?.publicKey;

    if (!publicKey) {
      throw new Error(
        "VAPID public key was not returned by the server."
      );
    }

    // Reuse existing subscription if available
    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(publicKey),
        });
    }

    // Send subscription to backend
    await api.post(
      "/notifications/push/subscribe",
      {
        subscription: subscription.toJSON(),
      }
    );

    console.log(
      "Push notifications enabled successfully."
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to enable push notifications:",
      error.response?.data || error.message
    );

    return false;
  }
}

export async function disablePushNotifications() {
  try {
    if (!("serviceWorker" in navigator)) {
      return false;
    }

    const registration =
      await navigator.serviceWorker.getRegistration(
        SERVICE_WORKER_PATH
      );

    if (!registration) {
      return false;
    }

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      return true;
    }

    await api.delete(
      "/notifications/push/unsubscribe",
      {
        data: {
          endpoint: subscription.endpoint,
        },
      }
    );

    await subscription.unsubscribe();

    console.log(
      "Push notifications disabled."
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to disable push notifications:",
      error.response?.data || error.message
    );

    return false;
  }
}