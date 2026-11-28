/**
 * Service for Lazy-Loading and Retrieving Monster Fluff / Lore data.
 * Keeps the initial application load ultralight by fetching monster_fluff.json on demand or during idle time.
 */

let fluffCache = null;
let fluffPromise = null;

export async function loadMonsterFluffData() {
  if (fluffCache) return fluffCache;
  if (fluffPromise) return fluffPromise;

  fluffPromise = (async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const fluffUrl = `${cleanBase}data/monster_fluff.json`;

      const response = await fetch(fluffUrl);
      if (!response.ok) {
        throw new Error(`Failed to load monster fluff (status: ${response.status})`);
      }
      fluffCache = await response.json();
      return fluffCache;
    } catch (err) {
      console.warn('Could not load monster fluff data:', err.message);
      fluffCache = {};
      return fluffCache;
    } finally {
      fluffPromise = null;
    }
  })();

  return fluffPromise;
}

/**
 * Retrieves the lore/fluff object for a given creature.
 * Returns null if no lore exists.
 */
export async function getMonsterFluff(creature) {
  if (!creature) return null;
  const data = await loadMonsterFluffData();
  if (!data) return null;

  const idKey = creature.id;
  if (idKey && data[idKey]) return data[idKey];

  const name = creature.name || '';
  const source = creature.source || '';
  const directKey = `${name.toLowerCase()}__${source.toLowerCase()}`;
  if (data[directKey]) return data[directKey];

  return null;
}

/**
 * Preload fluff data in the background during idle periods
 */
export function preloadFluffWhenIdle() {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      loadMonsterFluffData();
    }, { timeout: 4000 });
  } else if (typeof setTimeout !== 'undefined') {
    setTimeout(() => {
      loadMonsterFluffData();
    }, 2000);
  }
}
