/**
 * Bestiary IndexedDB Cache Manager
 * Prevents redundant downloads of the 35MB bestiary.json file from GitHub Pages,
 * protecting against bandwidth quota overruns and providing near-instant loading.
 * Automatically invalidates when CURRENT_DATA_VERSION changes.
 */

export const CURRENT_DATA_VERSION = '20261106_recharge_fix';

const DB_NAME = 'DND_BESTIARY_PERSISTENT_CACHE';
const DB_VERSION = 3; // Incremented to automatically bust stale caches and load corrected recharges
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
 * Clears the local bestiary cache from IndexedDB
 */
export async function clearBestiaryCache() {
  const db = await openDB();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    console.log('🧹 Caché de bestiario limpiada');
  } catch (e) {
    console.warn('Error clearing cache:', e);
  }
}

/**
 * Fetches bestiary data with intelligent local caching and version enforcement.
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

  const cleanUrl = dataUrl.split('?')[0];
  const versionedUrl = `${cleanUrl}?v=${CURRENT_DATA_VERSION}`;

  // Check if cache matches current application data version
  const isVersionMatch = cachedMeta && cachedMeta.version === CURRENT_DATA_VERSION;

  // If we have cached data and versions match, verify if remote changed via HEAD
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0 && isVersionMatch) {
    try {
      const headRes = await fetch(versionedUrl, { method: 'HEAD', cache: 'no-cache' });
      if (headRes.ok) {
        const currentETag = headRes.headers.get('ETag') || headRes.headers.get('Last-Modified') || '';
        
        // If ETag matches or server is reachable with same ETag, return cached data (0 BYTES DOWNLOADED)
        if (currentETag && cachedMeta.etag && currentETag === cachedMeta.etag) {
          console.log(`⚡ Bestiary cargado desde IndexedDB local (${cachedData.length} criaturas, 0 bytes descargados)`);
          return cachedData;
        }
      }
    } catch (headErr) {
      // If offline, safely return cached version
      console.log('⚡ Bestiary cargado desde caché local offline');
      return cachedData;
    }
  }

  // If no cache or older version detected, fetch the full JSON with cache reload
  console.log(`📥 Descargando bestiario actualizado v${CURRENT_DATA_VERSION} desde el servidor...`);
  const res = await fetch(versionedUrl, { cache: 'reload' });
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
        putInDB(db, META_KEY, { 
          version: CURRENT_DATA_VERSION, 
          etag, 
          cachedAt: new Date().toISOString(), 
          count: indexedData.length 
        })
      ]);
      console.log(`💾 Bestiario v${CURRENT_DATA_VERSION} guardado en IndexedDB local (${indexedData.length} criaturas)`);
    } catch (saveErr) {
      console.warn('Could not persist to IndexedDB:', saveErr);
    }
  }

  return indexedData;
}
