// Service for fetching latest tweets using Nitter RSS feeds
// This provides a way to get latest tweet URLs without Twitter API authentication

interface NitterTweet {
  title: string;
  link: string;
  pubDate: string;
}

// Get the appropriate URL for Nitter RSS feed
function getNitterRSSUrl(username: string): string {
  // In development, use the Vite proxy
  if (import.meta.env.DEV) {
    return `/api/nitter/${username}/rss`;
  }
  
  // In production, use direct URL (might need additional CORS handling)
  return `https://nitter.net/${username}/rss`;
}

// Fetch latest tweets for a user using Nitter RSS
export async function fetchLatestTweetsFromNitter(username: string): Promise<string[]> {
  try {
    const url = getNitterRSSUrl(username);
    
    console.log(`Fetching RSS for ${username} from:`, url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    // Parse XML using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parsing error');
    }
    
    // Get the first item (latest tweet)
    const item = xmlDoc.querySelector('item');
    if (!item) {
      console.log(`No <item> found in RSS for ${username}`);
      return [];
    }
    
    const title = item.querySelector('title')?.textContent || '';
    let link = item.querySelector('link')?.textContent || '';
    const pubDate = item.querySelector('pubDate')?.textContent || '';
    
    if (!link) {
      console.log(`No link found in RSS item for ${username}`);
      return [];
    }
    
    // Convert Nitter URL to Twitter URL
    link = link.replace('https://nitter.net', 'https://twitter.com');
    
    console.log(`Successfully found tweet for ${username}:`, { title, link, pubDate });
    
    return [link];
  } catch (error) {
    console.error(`Error fetching tweets for ${username}:`, error);
    return [];
  }
}

// Fetch latest tweets for multiple users
export async function fetchLatestTweetsForUsers(usernames: string[]): Promise<{ [username: string]: string[] }> {
  const results: { [username: string]: string[] } = {};
  
  console.log(`Fetching tweets for ${usernames.length} users:`, usernames);
  
  // Use Promise.allSettled to handle individual failures gracefully
  const promises = usernames.map(async (username) => {
    const tweets = await fetchLatestTweetsFromNitter(username);
    return { username, tweets };
  });
  
  const settledPromises = await Promise.allSettled(promises);
  
  settledPromises.forEach((result, index) => {
    const username = usernames[index];
    if (result.status === 'fulfilled') {
      const { tweets } = result.value;
      results[username] = tweets;
      console.log(`Successfully fetched ${tweets.length} tweets for ${username}`);
    } else {
      console.error(`Failed to fetch tweets for ${username}:`, result.reason);
      results[username] = [];
    }
  });
  
  return results;
}

// Alternative implementation using a CORS proxy
// This is needed if direct Nitter access is blocked by CORS
export async function fetchLatestTweetsWithProxy(username: string, proxyUrl: string = ''): Promise<string[]> {
  try {
    const nitterUrl = `https://nitter.net/${username}/rss`;
    const finalUrl = proxyUrl ? `${proxyUrl}${encodeURIComponent(nitterUrl)}` : nitterUrl;
    
    const response = await fetch(finalUrl);
    
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    
    const item = xmlDoc.querySelector('item');
    if (!item) return [];
    
    let link = item.querySelector('link')?.textContent || '';
    if (!link) return [];
    
    link = link.replace('https://nitter.net', 'https://twitter.com');
    
    return [link];
  } catch (error) {
    console.error(`Error fetching tweets for ${username}:`, error);
    return [];
  }
} 