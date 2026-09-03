self.addEventListener('push', function(event) {
  let payload = {};
  
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'Technova Update', body: event.data.text() };
    }
  } else {
    payload = { title: 'Technova Update', body: 'A new update is available!' };
  }

  const options = {
    body: payload.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2',
      url: payload.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Technova', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
