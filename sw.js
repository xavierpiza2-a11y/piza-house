const CACHE = 'blindtest-v9';
const ASSETS = [
  '/blind-test/',
  '/blind-test/index.html',
  '/blind-test/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Ne jamais intercepter : Firebase, APIs externes, requêtes POST
  if (
    e.request.method !== 'GET' ||
    url.includes('firebasedatabase') ||
    url.includes('googleapis') ||
    url.includes('deezer.com') ||
    url.includes('gstatic.com') ||
    url.includes('workers.dev') ||
    url.includes('anthropic.com')
  ) {
    return; // Laisser passer sans interception
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
