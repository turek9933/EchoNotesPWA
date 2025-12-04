const CACHE_NAME = 'echo-notes';
const CACHE_VERSION = 2;
const CACHE_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/main.js',
    '/manifest.webmanifest',
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
            .then(() => self.skipWaiting())// Natychmiastowa aktywacja SW, po s-cache-owaniu danych
            .catch((e) => console.error('Failed to cache files', e))
    );
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
            .then(() => self.clients.claim())// Przejęcie kontroli nad wszystkimi klientami
            .catch((e) => console.error('Failed to clear old caches', e))
    ); 
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
            }).catch((e) => console.warn('Failed to fetch cache in the background', e));

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
            return fetch(request)
            .then(fetchResponse => {
                // Sprawdzenie czy pobrana odpowiedz jest ok
                // Jeśli fetch się udał, ale zakończył się 'dziwną' odpowiedzią,
                // zwracamy ją do użytkownika, ale jej nie cache-ujemy
                if (!fetchResponse?.ok) return fetchResponse;

                // Klon odpowiedzi z sieci
                const responseToCache = fetchResponse.clone();

                // Zapisanie do cache-a
                cache.put(request, responseToCache);
                return fetchResponse;
            })
            .catch((e) => {
                console.error('Failed to fetch cache from network', e);
                return caches.match('/offline.html');
            });
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

    if (url.pathname.match(/\.(png|jpg|gif|ttf)/)) {
        console.log('Static assets -> Cache first');
        event.respondWith(cacheFirst(request));
        return;
    }

    console.log('Default -> Stale while revalidate');
    event.respondWith(staleWhileRevalidate(request));
});