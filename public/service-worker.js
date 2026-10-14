const CACHE='conahp-b18g-public-v1';const ASSETS=['/','/index.html','/b18.css','/b18.js','/schedule.json','/schedule-utils.js','/logo-conahp.svg','/icon-192.png','/icon-512.png','/icon-maskable-192.png','/icon-maskable-512.png','/manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;
 if(r.mode==='navigate'){e.respondWith(fetch(r).catch(()=>caches.match('/index.html')));return;}
 if(ASSETS.includes(u.pathname))e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(r,res.clone()));return res})));});
