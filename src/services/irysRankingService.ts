import axios from 'axios';

interface RankingData {
  address: string;
  rank: number;
  timestamp: number;
}

class IrysRankingService {
  private static MUTABLE_REF_URL = 'https://gateway.irys.xyz/mutable/BMaxiAyEs2ed1bJMLBx5nDVB7UkWnvGEG5NExvZrYKjr';
  private static CACHE_KEY = 'irys_ranking_data';
  private static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private static fetchPromise: Promise<RankingData[]> | null = null;

  static async fetchRankingData(): Promise<RankingData[]> {
    // Check cache first
    const cached = this.getCachedData();
    if (cached) {
      console.log('[IrysRankingService] Returning cached data:', cached.length, 'entries');
      return cached;
    }

    // If already fetching, return the same promise
    if (this.fetchPromise) {
      console.log('[IrysRankingService] Already fetching, returning existing promise');
      return this.fetchPromise;
    }

    // Start new fetch
    console.log('[IrysRankingService] Starting new fetch...');
    this.fetchPromise = this.performFetch();
    
    try {
      const data = await this.fetchPromise;
      console.log('[IrysRankingService] Fetch completed, got', data.length, 'entries');
      return data;
    } catch (error) {
      console.error('[IrysRankingService] Fetch failed:', error);
      
      // Return empty array instead of throwing to prevent the component from showing error
      // This allows us to see the "No correlation data" message instead
      return [];
    } finally {
      this.fetchPromise = null;
    }
  }

  private static async performFetch(): Promise<RankingData[]> {
    try {
      console.log('[IrysRankingService] Fetching mutable reference:', this.MUTABLE_REF_URL);
      
      // Use axios to fetch data (same as irysService.ts)
      const response = await axios.get(this.MUTABLE_REF_URL, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json, text/plain, */*',
        }
      });

      console.log('[IrysRankingService] Response status:', response.status);
      console.log('[IrysRankingService] Response data type:', typeof response.data);
      
      let data = response.data;
      
      // If response is a string, try to parse it
      if (typeof data === 'string') {
        console.log('[IrysRankingService] Response is string, length:', data.length);
        console.log('[IrysRankingService] Response preview:', data.substring(0, 200));
        
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.log('[IrysRankingService] JSON parse failed, trying text format');
          return this.parseTextFormat(data);
        }
      }
      
      // If we have JSON data, parse it
      if (typeof data === 'object') {
        return this.parseJsonFormat(data);
      }
      
      // Fallback to text parsing
      return this.parseTextFormat(String(data));
      
    } catch (error) {
      console.error('[IrysRankingService] Error fetching ranking data:', error);
      
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('[IrysRankingService] Response error:', error.response.status, error.response.statusText);
        } else if (error.request) {
          console.error('[IrysRankingService] No response received');
        } else {
          console.error('[IrysRankingService] Request setup error:', error.message);
        }
      }
      
      throw error;
    }
  }

  private static parseJsonFormat(data: any): RankingData[] {
    const rankings: RankingData[] = [];
    const timestamp = Date.now();

    // The data format is: { "@username": ["Project1 Xth", "Project2 Yth", ...] }
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.entries(data).forEach(([username, projects]) => {
        if (Array.isArray(projects)) {
          // Look for Irys project ranking
          const irysProject = projects.find((project: string) => 
            project.toLowerCase().startsWith('irys ')
          );
          
          if (irysProject) {
            // Extract rank from "Irys 645th" format
            const match = irysProject.match(/Irys (\d+)(?:st|nd|rd|th)/i);
            if (match) {
              const rank = parseInt(match[1]);
              // Remove @ if present and add it back to ensure consistency
              const cleanUsername = username.startsWith('@') ? username : `@${username}`;
              rankings.push({
                address: cleanUsername,
                rank: rank,
                timestamp
              });
            }
          }
        }
      });
    }

    console.log(`[IrysRankingService] Parsed ${rankings.length} Irys rankings`);
    this.cacheData(rankings);
    return rankings;
  }

  private static parseTextFormat(text: string): RankingData[] {
    const rankings: RankingData[] = [];
    const timestamp = Date.now();
    
    // Split by lines and parse
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach((line, index) => {
      // Skip header lines
      if (index === 0 && (line.includes('rank') || line.includes('address'))) {
        return;
      }
      
      // Try different parsing strategies
      // Format 1: "rank,address" or "rank\taddress"
      const parts = line.split(/[,\t\s]+/);
      if (parts.length >= 2) {
        const rank = parseInt(parts[0]);
        const address = parts[1].trim();
        if (!isNaN(rank) && address) {
          rankings.push({ address, rank, timestamp });
        }
      } else if (parts.length === 1) {
        // Format 2: Just addresses in order
        const address = parts[0].trim();
        if (address && address.length > 10) { // Basic validation
          rankings.push({ address, rank: index + 1, timestamp });
        }
      }
    });

    this.cacheData(rankings);
    return rankings;
  }

  private static getCachedData(): RankingData[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private static cacheData(data: RankingData[]): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('[IrysRankingService] Error caching data:', error);
    }
  }

  static clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }
}

export { IrysRankingService };
export type { RankingData }; 