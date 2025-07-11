import { Note } from '../types';

interface CacheItem {
  data: Note[];
  timestamp: number;
  project: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY_PREFIX = 'cm-notes-cache-';
const LAST_REFRESH_KEY = 'cm-notes-last-refresh';

export class CacheService {
  private static getCacheKey(project: string): string {
    return `${CACHE_KEY_PREFIX}${project}`;
  }

  static saveToCache(project: string, notes: Note[]): void {
    try {
      const cacheItem: CacheItem = {
        data: notes,
        timestamp: Date.now(),
        project
      };
      
      localStorage.setItem(this.getCacheKey(project), JSON.stringify(cacheItem));
      console.log(`[Cache] Saved ${notes.length} notes for project ${project}`);
    } catch (error) {
      console.error('[Cache] Error saving to cache:', error);
    }
  }

  static getFromCache(project: string): Note[] | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(project));
      if (!cached) return null;

      const cacheItem: CacheItem = JSON.parse(cached);
      
      // Check if cache is for the same project
      if (cacheItem.project !== project) {
        this.clearCache(project);
        return null;
      }

      console.log(`[Cache] Retrieved ${cacheItem.data.length} notes for project ${project}`);
      return cacheItem.data;
    } catch (error) {
      console.error('[Cache] Error reading from cache:', error);
      this.clearCache(project);
      return null;
    }
  }

  static isCacheValid(project: string): boolean {
    try {
      const cached = localStorage.getItem(this.getCacheKey(project));
      if (!cached) return false;

      const cacheItem: CacheItem = JSON.parse(cached);
      const age = Date.now() - cacheItem.timestamp;
      
      return age < CACHE_DURATION && cacheItem.project === project;
    } catch (error) {
      console.error('[Cache] Error checking cache validity:', error);
      return false;
    }
  }

  static clearCache(project: string): void {
    try {
      localStorage.removeItem(this.getCacheKey(project));
      console.log(`[Cache] Cleared cache for project ${project}`);
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  static clearAllCaches(): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('[Cache] Cleared all caches');
    } catch (error) {
      console.error('[Cache] Error clearing all caches:', error);
    }
  }

  static getCacheAge(project: string): number | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(project));
      if (!cached) return null;

      const cacheItem: CacheItem = JSON.parse(cached);
      return Date.now() - cacheItem.timestamp;
    } catch (error) {
      console.error('[Cache] Error getting cache age:', error);
      return null;
    }
  }

  static markPageRefresh(): void {
    try {
      localStorage.setItem(LAST_REFRESH_KEY, Date.now().toString());
    } catch (error) {
      console.error('[Cache] Error marking page refresh:', error);
    }
  }

  static shouldRefreshOnLoad(): boolean {
    try {
      const lastRefresh = localStorage.getItem(LAST_REFRESH_KEY);
      if (!lastRefresh) return true;

      const timeSinceRefresh = Date.now() - parseInt(lastRefresh);
      // If less than 1 second has passed, consider it a fresh page load
      return timeSinceRefresh < 1000;
    } catch (error) {
      console.error('[Cache] Error checking refresh status:', error);
      return true;
    }
  }
} 