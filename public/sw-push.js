// public/sw-push.js — Service Worker para Web Push Notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: "MarketForge", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title || "MarketForge", {
      body: payload.body || "",
      icon: payload.icon || "https://i.postimg.cc/jdB530mK/mkt.png",
      badge: payload.badge || "https://i.postimg.cc/jdB530mK/mkt.png",
      tag: payload.tag || "mf-notif",
      data: { url: payload.url || "/" },
      requireInteraction: false,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
