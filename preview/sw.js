const CACHE="vox-holographic-core-01";
const FILES=["./","./index.html","./auth.html","./app.css?v=app11","./app.js?v=app07","./auth.css?v=auth19","./auth.js?v=auth14","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==="navigate"){
    const fallback=url.pathname.endsWith("/auth.html")?"./auth.html":"./index.html";
    event.respondWith(fetch(request,{cache:"no-store"}).then(response=>{
      if(response&&response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
      return response;
    }).catch(()=>caches.match(request).then(cached=>cached||caches.match(fallback))));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response&&response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
    return response;
  }).catch(()=>caches.match("./index.html"))));
});