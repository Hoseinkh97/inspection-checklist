// Offline cache for the installable web-app build. The version below changes on every build,
// so a new deploy replaces the old cache the next time the phone is online.
const CACHE = 'inspection-checklist-fda950ea95';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('inspection-checklist-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith((async()=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
      try{
        const response=await fetch(req,{cache:'no-store',signal:controller.signal});
        if(!response.ok)throw new Error('Navigation unavailable');
        if(response.headers.get('Content-Type')?.includes('text/html')){
          const cache=await caches.open(CACHE);await cache.put('./index.html',response.clone());
        }
        return response;
      }catch(error){const cached=await caches.match('./index.html');if(cached)return cached;throw error;}
      finally{clearTimeout(timer);}
    })());
    return;
  }
  if(req.cache==='no-store'||req.cache==='reload'){e.respondWith(fetch(req));return;}
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
