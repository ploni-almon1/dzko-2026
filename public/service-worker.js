const CACHE_NAME = 'dzko-offline-cache-v1';

// Fáze instalace: Aktivujeme ihned
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Fáze aktivace: Převezmeme kontrolu nad stránkou
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fáze odchytávání požadavků (Zlaté jádro offline režimu)
self.addEventListener('fetch', (event) => {
  // Nechceme cachovat volání do Airtable (to už máme vyřešené v App.js) 
  // a zajímají nás jen klasické GET požadavky (stahování kódu, obrázků, fontů).
  if (event.request.method !== 'GET' || event.request.url.includes('api.airtable.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Pokud jsme ONLINE a vše prošlo, stáhneme si čerstvou verzi webu a uložíme ji "do šuplíku"
        if (networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Pokud jsme OFFLINE (fetch spadne), zachráníme situaci tím, že pošleme data ze šuplíku!
        return caches.match(event.request);
      })
  );
});
