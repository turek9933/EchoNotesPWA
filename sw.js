const CACHE_NAME = 'echo-notes';
const CACHE_VERSION = 1;
const CACHE_FILES = [
    '/',
    '/index.html',
    '/main.js',
    '/manifest.json',
    '/style.css',
    '/fonts/Caveat-Regular.ttf',
    'icons/android/android-launchericon-48-48.png',
    'icons/android/android-launchericon-72-72.png',
    'icons/android/android-launchericon-144-144.png',
    'icons/android/android-launchericon-512-512.png',
    'icons/favicon/favicon-16x16.png',
    'icons/favicon/favicon-32x32.png',
    'icons/ios/16.png',
    'icons/ios/64.png',
    'icons/ios/180.png',
    'icons/ios/512.png'
];

const CACHE = `${CACHE_NAME}-${CACHE_VERSION}`;

self.addEventListener('install', event => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then(cache => cache.addAll(CACHE_FILES))
    );

    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => 
                Promise.all(
                    keys
                        .filter(k => k.startsWith(`${CACHE_NAME}-` && k !== CACHE))
                        .map(k => caches.delete(k))
                )
            )
    );

    self.clients.claim();
});

function staleWhileRevalidate(request) {
    // Otwarcie cache-a
    return caches.open(CACHE).then(cache => {
        // Sprawdzenie czy jest w cache-u
        return cache.match(request).then(cachedResponse => {
            // Spróbuj pobrać świeżą wersję w tle
            const fetchPromise = fetch(request).then(networkResponse => {
                // Aktualizuj cache
                cache.put(request, networkResponse.clone());
                return networkResponse;
                // W przypadku braku sieci zwróć cache
            }).catch(() => cachedResponse);

            // Natychmiastowa zwrotka z cache-a lub z sieci
            return cachedResponse || fetchPromise;
        })
    });
}

function cacheFirst(request) {
    // Otwarcie cache-a
    return caches.open(CACHE).then(cache => {
        // Sprawdzenie czy jest w cache-u
        return cache.match(request).then(response => {
            
            // Zwrócenie odpowiedzi z cache-a
            if (response) return response;

            // Pobranie odpowiedzi z sieci
            return fetch(request).then(fetchResponse => {
                    // Zapisanie pobranej odpowiedzi w cache-u
                    cache.put(request, fetchResponse.clone());
                    // Zwrócenie pobranej odpowiedzi użytnikowi
                    return fetchResponse;
                })
        })
    });
}

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        console.log('Mutation -> Network only');
        return;
    }

    if (url.pathname.match(/\.(png|jpg|gif|css|js|ttf)/)) {
        console.log('Static assets -> Cache first');
        event.respondWith(cacheFirst(request));
        return;
    }

    console.log('Default -> Stale while revalidate');
    event.respondWith(staleWhileRevalidate(request));
});