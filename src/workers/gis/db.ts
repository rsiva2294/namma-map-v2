import { openDB } from 'idb';

export const CACHE_DB_NAME = 'nammamap-cache';
export const CACHE_STORE = 'gis-data';
export const CACHE_VERSION = 1;

export async function getCacheDB() {
  return openDB(CACHE_DB_NAME, CACHE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'url' });
      }
    },
  });
}

export async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  const db = await getCacheDB();
  const cached = await db.get(CACHE_STORE, url);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      // Cache for 24 hours
      await db.put(CACHE_STORE, {
        url,
        data,
        expiresAt: now + (24 * 60 * 60 * 1000)
      });
      
      return data;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }
}
