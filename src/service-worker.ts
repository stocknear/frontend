/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope

import { build, files, version } from '$service-worker';


const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];


// install service worker
self.addEventListener('install', event => {
    async function addFilesToCache() {
        const cache = await caches.open(CACHE)
        await cache.addAll(ASSETS);
    }

    event.waitUntil(addFilesToCache())
})

self.addEventListener('activate', event => {
    async function deleteOldCaches() {
        for(const key of await caches.keys()) {
            if(key !== CACHE) {
                await caches.delete(key)
            }
        }
    }
    event.waitUntil(deleteOldCaches());
})

//listen to fetch events
self.addEventListener('fetch', event => {
    if(event.request.method !== 'GET') return

    async function respond() {
        const url = new URL(event.request.url);
        const cache = await caches.open(CACHE);

        //serve build files from cache;
        if(ASSETS.includes(url.pathname)) {
            const cacheResponse = await cache.match(url.pathname);
            if(cacheResponse) {
                return cacheResponse;
            }
        }
        // try the network first
        try {
            const response = await fetch(event.request);
            const isNotExtension = url.protocol === 'http:';
            const isSuccess = response.status === 200;
            
            if(isNotExtension && isSuccess) {
                cache.put(event.request, response.clone())
            }

            return response;

        } catch {
            //fall back to cache
            const cachedResponse = await cache.match(url.pathname);
            if(cachedResponse) {
                return cachedResponse;
            }
        }
    
        return new Response('Not found', {status: 404});
    }

})

self.addEventListener('message', event => {
    if(event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})