// Service for fetching latest tweets using Nitter RSS feeds
// This provides a way to get latest tweet URLs without Twitter API authentication

interface NitterTweet {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

// Parse RSS XML to extract tweet information
function parseNitterRSS(xmlText: string): NitterTweet[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
  
  const items = xmlDoc.getElementsByTagName('item');
  const tweets: NitterTweet[] = [];
  
  for (let i = 0; i < items.length && i < 5; i++) { // Limit to 5 latest tweets
    const item = items[i];
    const title = item.getElementsByTagName('title')[0]?.textContent || '';
    const link = item.getElementsByTagName('link')[0]?.textContent || '';
    const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';
    const description = item.getElementsByTagName('description')[0]?.textContent || '';
    
    if (link) {
      tweets.push({
        title,
        link,
        pubDate,
        description
      });
    }
  }
  
  return tweets;
}

// Convert Nitter URL to Twitter URL
function nitterToTwitterURL(nitterUrl: string): string {
  return nitterUrl.replace('https://nitter.net', 'https://twitter.com');
}

// Fetch latest tweets for a user using Nitter RSS
export async function fetchLatestTweetsFromNitter(username: string): Promise<string[]> {
  try {
    const nitterUrl = `https://nitter.net/${username}/rss`;
    
    // Note: This might face CORS issues in browser environment
    // In production, you might need to use a proxy server
    const response = await fetch(nitterUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch RSS for ${username}:`, response.status);
      return [];
    }
    
    const xmlText = await response.text();
    const tweets = parseNitterRSS(xmlText);
    
    // Convert Nitter URLs to Twitter URLs and return only the first (latest) tweet
    const twitterUrls = tweets
      .map(tweet => nitterToTwitterURL(tweet.link))
      .filter(url => url.includes('/status/'));
    
    return twitterUrls.slice(0, 1); // Return only the latest tweet
  } catch (error) {
    console.error(`Error fetching tweets for ${username}:`, error);
    return [];
  }
}

// Fetch latest tweets for multiple users
export async function fetchLatestTweetsForUsers(usernames: string[]): Promise<{ [username: string]: string[] }> {
  const results: { [username: string]: string[] } = {};
  
  // Use Promise.allSettled to handle individual failures gracefully
  const promises = usernames.map(async (username) => {
    const tweets = await fetchLatestTweetsFromNitter(username);
    return { username, tweets };
  });
  
  const settledPromises = await Promise.allSettled(promises);
  
  settledPromises.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { username, tweets } = result.value;
      results[username] = tweets;
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
      console.error(`Failed to fetch RSS for ${username}:`, response.status);
      return [];
    }
    
    const xmlText = await response.text();
    const tweets = parseNitterRSS(xmlText);
    
    const twitterUrls = tweets
      .map(tweet => nitterToTwitterURL(tweet.link))
      .filter(url => url.includes('/status/'));
    
    return twitterUrls.slice(0, 1);
  } catch (error) {
    console.error(`Error fetching tweets for ${username}:`, error);
    return [];
  }
} 