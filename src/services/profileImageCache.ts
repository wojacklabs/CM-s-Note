interface ProfileImageCache {
  [twitterHandle: string]: {
    imageUrl: string;
    timestamp: number;
    isValid: boolean;
    isFallback?: boolean; // Add flag to track if it's a fallback image
  };
}

const CACHE_KEY = 'cm-profile-images-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_RETRY_DURATION = 5 * 60 * 1000; // 5 minutes for fallback images

export class ProfileImageCacheService {
  private static cache: ProfileImageCache = {};
  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);
        // Clean up expired entries
        const now = Date.now();
        for (const handle in this.cache) {
          if (now - this.cache[handle].timestamp > CACHE_DURATION) {
            delete this.cache[handle];
          }
        }
        this.save();
      }
    } catch (error) {
      console.error('[ProfileImageCache] Error loading cache:', error);
      this.cache = {};
    }
    
    this.initialized = true;
  }

  private static save() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('[ProfileImageCache] Error saving cache:', error);
    }
  }

  static getCachedImage(twitterHandle: string): string | null {
    this.init();
    const cached = this.cache[twitterHandle];
    
    if (cached && cached.isValid && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.imageUrl;
    }
    
    return null;
  }

  static setCachedImage(twitterHandle: string, imageUrl: string, isValid: boolean, isFallback: boolean = false) {
    this.init();
    this.cache[twitterHandle] = {
      imageUrl,
      timestamp: Date.now(),
      isValid,
      isFallback
    };
    this.save();
  }

  static async preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  static async loadProfileImage(twitterHandle: string, forceRefresh: boolean = false): Promise<string> {
    this.init();
    
    // Check cache first
    const cached = this.cache[twitterHandle];
    
    // If we have a valid non-fallback cache and not forcing refresh, return it
    if (!forceRefresh && cached && cached.isValid && !cached.isFallback && 
        (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.imageUrl;
    }
    
    // If we have a fallback cache but it's recent, return it
    // (unless forceRefresh is true, which happens in background updates)
    if (!forceRefresh && cached && cached.isFallback && 
        (Date.now() - cached.timestamp < FALLBACK_RETRY_DURATION)) {
      return cached.imageUrl;
    }

    // Try to load from unavatar.io
    const primaryUrl = `https://unavatar.io/twitter/${twitterHandle}`;
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(twitterHandle)}&background=d4a574&color=fff&size=56`;

    try {
      const success = await this.preloadImage(primaryUrl);
      if (success) {
        this.setCachedImage(twitterHandle, primaryUrl, true, false);
        return primaryUrl;
      }
    } catch (error) {
      console.error(`[ProfileImageCache] Error loading image for @${twitterHandle}:`, error);
    }

    // Use fallback
    this.setCachedImage(twitterHandle, fallbackUrl, true, true);
    return fallbackUrl;
  }

  static async preloadAllImages(twitterHandles: string[]): Promise<void> {
    const promises = twitterHandles.map(handle => this.loadProfileImage(handle, true));
    await Promise.allSettled(promises);
  }

  static clearCache() {
    this.cache = {};
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('[ProfileImageCache] Error clearing cache:', error);
    }
  }
} 