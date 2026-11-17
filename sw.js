const CACHE_NAME="vox-root-bridge-04";
const APP_SHELL=[
  "./",
  "./index.html",
  "./auth.html",
  "./manifest.webmanifest",
  "./icons/vox.svg",
  "./preview/auth.html",
  "./preview/auth.css?v=auth06",
  "./preview/auth.js?v=auth06",
  "./preview/index.html",
  "./preview/app.css?v=app03",
  "./preview/app.js?v=app03",
  "./preview/manifest.webmanifest",
  "./preview/icon.svg"
];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request,{cache:"no-store"}).then(response=>{
      if(response&&response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));
      return response;
    }).catch(()=>caches.match(request).then(cached=>cached||caches.match("./auth.html"))));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response&&response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));
    return response;
  })));
});