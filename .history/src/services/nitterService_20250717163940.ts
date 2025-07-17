// Service for fetching latest tweets using Nitter RSS feeds
// This provides a way to get latest tweet URLs without Twitter API authentication

import { getCorrectUsername } from './exampleTweetData';

interface NitterTweet {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

// List of Nitter instances to try (in order of preference)
const NITTER_INSTANCES = [
  'nitter.net',
  'nitter.it',
  'nitter.eu',
  'nitter.nl',
  'nitter.42l.fr'
];

// Parse RSS XML to extract tweet information
function parseNitterRSS(xmlText: string): NitterTweet[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
  
  // Check for XML parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    console.error('XML parsing error:', parserError.textContent);
    return [];
  }
  
  const items = xmlDoc.getElementsByTagName('item');
  const tweets: NitterTweet[] = [];
  
  console.log(`Found ${items.length} RSS items`);
  
  for (let i = 0; i < items.length && i < 5; i++) { // Limit to 5 latest tweets
    const item = items[i];
    const title = item.getElementsByTagName('title')[0]?.textContent || '';
    const link = item.getElementsByTagName('link')[0]?.textContent || '';
    const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';
    const description = item.getElementsByTagName('description')[0]?.textContent || '';
    
    console.log(`RSS item ${i + 1}:`, { title, link, pubDate });
    
    if (link && link.includes('/status/')) {
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
  // Handle different Nitter instances
  return nitterUrl.replace(/https:\/\/[^\/]+/, 'https://twitter.com');
}

// Get the appropriate URL for Nitter RSS feed
function getNitterRSSUrl(username: string, instance: string = 'nitter.net'): string {
  // In development, use the Vite proxy for nitter.net
  if (import.meta.env.DEV && instance === 'nitter.net') {
    return `/nitter-proxy/${username}/rss`;
  }
  
  // Use direct URL for other instances or production
  return `https://${instance}/${username}/rss`;
}

// Try fetching from a specific Nitter instance
async function tryNitterInstance(username: string, instance: string): Promise<string[]> {
  try {
    const nitterUrl = getNitterRSSUrl(username, instance);
    
    console.log(`Trying ${instance} for ${username}:`, nitterUrl);
    
    const response = await fetch(nitterUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch from ${instance} for ${username}:`, response.status, response.statusText);
      
      // Log response body for debugging
      const errorText = await response.text();
      console.error(`Response body:`, errorText.substring(0, 300));
      
      return [];
    }
    
    const xmlText = await response.text();
    
    // Log the raw XML for debugging
    console.log(`Raw XML from ${instance} for ${username}:`, xmlText.substring(0, 500) + '...');
    
    // Check if it's actually XML
    if (!xmlText.includes('<rss') && !xmlText.includes('<?xml')) {
      console.error(`Invalid XML response from ${instance} for ${username}`);
      return [];
    }
    
    const tweets = parseNitterRSS(xmlText);
    
    console.log(`Found ${tweets.length} tweets from ${instance} for ${username}`);
    
    // Convert Nitter URLs to Twitter URLs
    const twitterUrls = tweets
      .map(tweet => nitterToTwitterURL(tweet.link))
      .filter(url => url.includes('/status/'));
    
    console.log(`Converted URLs for ${username}:`, twitterUrls);
    
    return twitterUrls.slice(0, 1); // Return only the latest tweet
  } catch (error) {
    console.error(`Error fetching from ${instance} for ${username}:`, error);
    return [];
  }
}

// Fetch latest tweets for a user using Nitter RSS (try multiple instances)
export async function fetchLatestTweetsFromNitter(username: string): Promise<string[]> {
  // Use the correct username format
  const correctUsername = getCorrectUsername(username);
  
  console.log(`Starting to fetch tweets for ${username} (corrected to: ${correctUsername})`);
  
  // Try each Nitter instance until one works
  for (const instance of NITTER_INSTANCES) {
    console.log(`Trying instance: ${instance}`);
    
    const tweets = await tryNitterInstance(correctUsername, instance);
    
    if (tweets.length > 0) {
      console.log(`Successfully fetched ${tweets.length} tweets for ${correctUsername} from ${instance}`);
      return tweets;
    }
  }
  
  console.warn(`Failed to fetch tweets for ${correctUsername} from all instances`);
  return [];
}

// Fetch latest tweets for multiple users
export async function fetchLatestTweetsForUsers(usernames: string[]): Promise<{ [username: string]: string[] }> {
  const results: { [username: string]: string[] } = {};
  
  console.log(`Fetching tweets for ${usernames.length} users:`, usernames);
  
  // Process users sequentially to avoid overwhelming Nitter instances
  for (const username of usernames) {
    console.log(`Processing user: ${username}`);
    
    const tweets = await fetchLatestTweetsFromNitter(username);
    results[username] = tweets;
    
    if (tweets.length > 0) {
      console.log(`✅ Successfully fetched ${tweets.length} tweets for ${username}`);
    } else {
      console.log(`❌ Failed to fetch tweets for ${username}`);
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
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

// Manual test function for debugging specific users
export async function debugUserTweets(username: string): Promise<void> {
  const correctUsername = getCorrectUsername(username);
  
  console.log(`🔍 Debugging tweets for: ${username} (corrected to: ${correctUsername})`);
  
  for (const instance of NITTER_INSTANCES) {
    console.log(`\n--- Testing ${instance} ---`);
    
    const tweets = await tryNitterInstance(correctUsername, instance);
    
    if (tweets.length > 0) {
      console.log(`✅ Success! Found ${tweets.length} tweets`);
      console.log('URLs:', tweets);
      break;
    } else {
      console.log(`❌ No tweets found`);
    }
  }
} 