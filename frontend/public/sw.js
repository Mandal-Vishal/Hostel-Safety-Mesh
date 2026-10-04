self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {
      title: "Hostel Safety Mesh",
      body: "You have a new notification.",
    };
  }

  const title = data.title || "Hostel Safety Mesh";

  const options = {
    body: data.body || "You have a new notification.",
    icon: data.icon || undefined,
    badge: data.badge || undefined,
    tag: data.tag || "hostel-safety-mesh",
    renotify: true,
    requireInteraction: data.requireInteraction ?? true,
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();

          if ("navigate" in client) {
            client.navigate(
              new URL(targetUrl, self.location.origin).href
            );
          }

          return;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(
          new URL(targetUrl, self.location.origin).href
        );
      }
    })
  );
});