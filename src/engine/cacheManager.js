/**
 * Bestiary IndexedDB Cache Manager
 * Prevents redundant downloads of the 30MB bestiary.json file from GitHub Pages,
 * protecting against bandwidth quota overruns and providing near-instant loading.
 */

const DB_NAME = 'DND_BESTIARY_PERSISTENT_CACHE';
const DB_VERSION = 1;
const STORE_NAME = 'bestiary_data';
const CACHE_KEY = 'cached_indexed_creatures';
const META_KEY = 'cache_metadata';

/**
 * Opens or initializes the IndexedDB database
 */
function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('Could not open IndexedDB, falling back to network.');
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB not available:', e);
      resolve(null);
    }
  });
}

/**
 * Retrieves a key from the object store
 */
function getFromDB(db, key) {
  return new Promise((resolve) => {
    if (!db) {
      resolve(null);
      return;
    }
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Saves a key-value pair to the object store
 */
function putInDB(db, key, val) {
  return new Promise((resolve) => {
    if (!db) {
      resolve();
      return;
    }
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Fetches bestiary data with intelligent local caching:
 * 1. Checks if a local cache exists in IndexedDB.
 * 2. If cached, sends a lightweight HEAD request (0 bytes body) to check ETag / Last-Modified.
 * 3. If server data has NOT changed, loads directly from local disk (0 bytes transferred from GitHub).
 * 4. Only downloads the 30MB file if cache is missing or server reports a newer version.
 */
export async function loadBestiaryWithCache(dataUrl, processAndIndexFn) {
  const db = await openDB();

  let cachedData = null;
  let cachedMeta = null;

  if (db) {
    try {
      [cachedData, cachedMeta] = await Promise.all([
        getFromDB(db, CACHE_KEY),
        getFromDB(db, META_KEY)
      ]);
    } catch (e) {
      console.warn('Error reading from IndexedDB:', e);
    }
  }

  // If we have cached data, verify if the remote file has changed via HEAD (0 bytes)
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0 && cachedMeta) {
    try {
      const headRes = await fetch(dataUrl, { method: 'HEAD', cache: 'no-cache' });
      if (headRes.ok) {
        const currentETag = headRes.headers.get('ETag') || headRes.headers.get('Last-Modified') || '';
        
        // If ETag matches, return cached data immediately (0 BYTES DOWNLOADED)
        if (currentETag && cachedMeta.etag && currentETag === cachedMeta.etag) {
          console.log('⚡ Bestiary loaded from local IndexedDB cache (0 bytes transferred from GitHub)');
          return cachedData;
        }
      }
    } catch (headErr) {
      // If offline or network error, safely return the cached version
      console.log('⚡ Bestiary loaded from offline local cache');
      return cachedData;
    }
  }

  // If no cache or data was updated on server, fetch the full JSON
  console.log('📥 Descargando bestiario desde el servidor...');
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error('No se pudo cargar el archivo bestiary.json');

  const etag = res.headers.get('ETag') || res.headers.get('Last-Modified') || Date.now().toString();
  const rawData = await res.json();

  // Process and index
  const indexedData = processAndIndexFn(rawData);

  // Save to IndexedDB for all future visits
  if (db) {
    try {
      await Promise.all([
        putInDB(db, CACHE_KEY, indexedData),
        putInDB(db, META_KEY, { etag, cachedAt: new Date().toISOString(), count: indexedData.length })
      ]);
      console.log('💾 Bestiario guardado en IndexedDB local para futuras visitas');
    } catch (saveErr) {
      console.warn('Could not persist to IndexedDB:', saveErr);
    }
  }

  return indexedData;
}

