/* Service Worker · Asistente Nuestro Parche
   Estrategia:
   - App shell y módulos locales: cache-first (funciona sin internet tras la 1ª visita).
   - Recursos externos (fuentes, html2canvas, imágenes de noticias): network-first
     con respaldo en caché, para no romper nada si no hay conexión. */
const CACHE = 'asistente-np-v1';
const LOCAL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './modulos/noticias.html',
  './modulos/carrusel.html',
  './modulos/portadas.html',
  './modulos/videos.html',
  './modulos/video-news.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(LOCAL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;

  if (sameOrigin) {
    // Archivos de la app: primero caché, luego red.
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
  } else {
    // Recursos externos: primero red, guardando copia; si falla, caché.
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
