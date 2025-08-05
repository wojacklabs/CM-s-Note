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
const FALLBACK_RETRY_DURATION = 60 * 60 * 1000; // 1 hour for fallback images (reduced from 5 minutes)

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

  static getCachedImageInfo(twitterHandle: string): { imageUrl: string; isFallback: boolean } | null {
    this.init();
    const cached = this.cache[twitterHandle];
    
    if (cached && cached.isValid) {
      // For fallback images, only return if within retry duration
      if (cached.isFallback && (Date.now() - cached.timestamp >= FALLBACK_RETRY_DURATION)) {
        return null;
      }
      // For real images, check normal cache duration
      if (!cached.isFallback && (Date.now() - cached.timestamp >= CACHE_DURATION)) {
        return null;
      }
      return { imageUrl: cached.imageUrl, isFallback: cached.isFallback || false };
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
      // crossOrigin 제거 - CORS 에러 방지
      let resolved = false;
      
      // 빠른 타임아웃 설정 (3초)
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log(`[ProfileImageCache] Image load timeout for ${url}`);
          resolve(false);
        }
      }, 3000);
      
      img.onload = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          // unavatar.io의 기본 이미지는 대부분 작은 크기이지만 CORS로 인해 확인 불가
          // 대신 URL 패턴으로 판단하거나 로드 성공만 체크
          resolve(true);
        }
      };
      
      img.onerror = (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log(`[ProfileImageCache] Image load error for ${url}:`, error);
          resolve(false);
        }
      };
      
      // 이미지 소스 설정
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
    if (!forceRefresh && cached && cached.isFallback && 
        (Date.now() - cached.timestamp < FALLBACK_RETRY_DURATION)) {
      return cached.imageUrl;
    }

    // 여러 아바타 서비스를 시도
    const avatarServices = [
      `https://unavatar.io/twitter/${twitterHandle}`,
      // 대체 서비스 추가 가능
    ];
    
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(twitterHandle)}&background=d4a574&color=fff&size=200`;

    // 캐시가 없거나 오래된 경우에만 로그
    if (!cached || (Date.now() - cached.timestamp > FALLBACK_RETRY_DURATION)) {
      console.log(`[ProfileImageCache] Loading profile image for @${twitterHandle}`);
    }
    
    // Try each avatar service
    for (const serviceUrl of avatarServices) {
      try {
        const success = await this.preloadImage(serviceUrl);
        if (success) {
          // 성공하면 캐시하고 반환
          this.setCachedImage(twitterHandle, serviceUrl, true, false);
          return serviceUrl;
        }
      } catch (error) {
        // 에러 무시하고 다음 서비스 시도
      }
    }

    // 모든 서비스 실패시 fallback 사용
    this.setCachedImage(twitterHandle, fallbackUrl, true, true);
    return fallbackUrl;
  }

  static async preloadAllImages(twitterHandles: string[]): Promise<void> {
    // 병렬 처리하되 동시 요청 수를 제한
    const batchSize = 5;
    for (let i = 0; i < twitterHandles.length; i += batchSize) {
      const batch = twitterHandles.slice(i, i + batchSize);
      const promises = batch.map(handle => 
        this.loadProfileImage(handle, true).catch(() => {
          // 에러 무시
        })
      );
      await Promise.all(promises);
    }
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