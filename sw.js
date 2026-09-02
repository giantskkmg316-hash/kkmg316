// かんたん家計簿 - Service Worker
// オフラインで動作させるため、アプリ本体一式をキャッシュします。
// バージョンを上げる（v1 -> v2 など）と、古いキャッシュを破棄して更新を配信します。
var CACHE_NAME = "kakeibo-cache-v2";
var APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll(APP_SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(
          keys.filter(function(key){ return key !== CACHE_NAME; })
              .map(function(key){ return caches.delete(key); })
        );
      })
      .then(function(){ return self.clients.claim(); })
  );
});

// キャッシュ優先、なければネットワーク取得し、取得できたものは以後のために保存する。
// ネットワークにも届かない場合は index.html を返し、アプリの見た目を維持する。
self.addEventListener("fetch", function(event){
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if (cached) return cached;

      return fetch(event.request)
        .then(function(response){
          if (response && response.status === 200 && response.type === "basic"){
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
          }
          return response;
        })
        .catch(function(){ return caches.match("./index.html"); });
    })
  );
});
