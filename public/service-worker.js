// Never cache private API responses or authenticated documents.
const CACHE='conahp-m1-public-v1',SHELL=['/','/index.html','/app.js','/style.css','/manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(url.origin!==self.location.origin||req.method!=='GET')return;
 if(url.pathname==='/api/schedule'){event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put('/api/schedule',copy));}return response}).catch(()=>caches.match('/api/schedule')));return;}
 if(url.pathname.startsWith('/api/'))return; // no caching /api/me or /api/preferences
 if(SHELL.includes(url.pathname)){event.respondWith(caches.match(url.pathname).then(c=>c||fetch(req)));return;}
});
