import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'nammamap-cache';
const STORE_NAME = 'gis-data';
const DB_VERSION = 1;

interface CacheEntry {
  url: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private db: Promise<IDBPDatabase> | null = null;

  private async getDB() {
    if (!this.db) {
      this.db = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'url' });
          }
        },
      });
    }
    return this.db;
  }

  /**
   * Fetches data with caching logic
   * @param url URL to fetch
   * @param ttl Time to live in milliseconds (default 24 hours)
   */
  async fetchWithCache(url: string, ttl: number = 24 * 60 * 60 * 1000): Promise<any> {
    const db = await this.getDB();
    const cached = await db.get(STORE_NAME, url) as CacheEntry | undefined;

    if (cached && cached.expiresAt > Date.now()) {
      console.log(`[Cache] Hit: ${url}`);
      return cached.data;
    }

    console.log(`[Cache] Miss: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    await db.put(STORE_NAME, {
      url,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    });

    return data;
  }

  async clearCache() {
    const db = await this.getDB();
    await db.clear(STORE_NAME);
  }
}

export const cacheService = new CacheService();
