import { Tweet } from '../types';
import { getRealTweetURLsForUser } from './exampleTweetData';
import { fetchLatestTweetsForUsers } from './nitterService';

// Generate Twitter embed HTML using the blockquote format
export function generateTwitterEmbedHTML(tweetUrl: string, username: string): string {
  // Extract tweet ID from URL
  const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);
  const tweetId = tweetIdMatch ? tweetIdMatch[1] : '';
  
  return `
    <blockquote class="twitter-tweet">
      <a href="${tweetUrl}?ref_src=twsrc%5Etfw"></a>
    </blockquote>
  `;
}

// Get Twitter embed HTML using oembed API (fallback method)
export async function getTwitterEmbedHTML(tweetUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true&dnt=true&hide_thread=true`
    );
    
    if (!response.ok) {
      console.error('Failed to fetch embed HTML:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.html;
  } catch (error) {
    console.error('Error fetching Twitter embed:', error);
    return null;
  }
}

// Get tweet URLs for a user (combines manual data and Nitter RSS)
export async function getTweetURLsForUser(username: string): Promise<string[]> {
  // First check if we have manually configured tweet URLs
  const manualTweetUrls = getRealTweetURLsForUser(username);
  if (manualTweetUrls.length > 0) {
    return manualTweetUrls;
  }
  
  // If no manual URLs, try to fetch from Nitter RSS
  try {
    const nitterResults = await fetchLatestTweetsForUsers([username]);
    return nitterResults[username] || [];
  } catch (error) {
    console.error(`Error fetching tweets for ${username}:`, error);
    return [];
  }
}

// Get embedded tweets for multiple users
export async function getEmbeddedTweetsForUsers(usernames: string[]): Promise<{ username: string; embedHTML: string | null; tweetUrl: string }[]> {
  const embeddedTweets = [];
  
  // Try to fetch latest tweets from Nitter for all users at once
  let nitterResults: { [username: string]: string[] } = {};
  try {
    nitterResults = await fetchLatestTweetsForUsers(usernames);
  } catch (error) {
    console.error('Error fetching tweets from Nitter:', error);
  }
  
  for (const username of usernames) {
    // Check manual data first
    const manualTweetUrls = getRealTweetURLsForUser(username);
    
    // Get either manual URLs or Nitter RSS URLs
    const tweetUrls = manualTweetUrls.length > 0 
      ? manualTweetUrls 
      : (nitterResults[username] || []);
    
    if (tweetUrls.length > 0) {
      // We have real tweet URLs, generate embed HTML
      for (const tweetUrl of tweetUrls.slice(0, 1)) { // Only take the first (latest) tweet
        const embedHTML = generateTwitterEmbedHTML(tweetUrl, username);
        
        embeddedTweets.push({
          username,
          embedHTML,
          tweetUrl
        });
      }
    } else {
      // Show placeholder for users without tweet URLs
      const placeholderHTML = `
        <div class="twitter-embed-placeholder">
          <div class="embed-header">
            <img src="https://unavatar.io/twitter/${username}" alt="@${username}" />
            <div class="embed-author">
              <div class="author-name">@${username}</div>
              <div class="author-handle">Twitter User</div>
            </div>
          </div>
          <div class="embed-content">
            <p>Unable to fetch latest tweets for @${username}</p>
            <p>This could be due to:</p>
            <ul>
              <li>Private account</li>
              <li>Account suspended or deleted</li>
              <li>No recent tweets</li>
              <li>Network connectivity issues</li>
            </ul>
            <p>You can manually add tweet URLs in <code>exampleTweetData.ts</code></p>
          </div>
          <div class="embed-footer">
            <a href="https://twitter.com/${username}" target="_blank" rel="noopener noreferrer">Visit @${username} on Twitter →</a>
          </div>
        </div>
      `;
      
      embeddedTweets.push({
        username,
        embedHTML: placeholderHTML,
        tweetUrl: `https://twitter.com/${username}`
      });
    }
  }
  
  return embeddedTweets;
}

// Initialize Twitter widgets (call this once when the app loads)
export function initializeTwitterWidgets() {
  // Check if the script is already loaded
  if ((window as any).twttr) {
    return;
  }
  
  // Add Twitter widgets script
  const script = document.createElement('script');
  script.src = 'https://platform.twitter.com/widgets.js';
  script.async = true;
  script.charset = 'utf-8';
  
  script.onload = () => {
    console.log('Twitter widgets loaded');
  };
  
  document.body.appendChild(script);
}

// Render Twitter embeds after they are added to DOM
export function renderTwitterEmbeds() {
  if ((window as any).twttr && (window as any).twttr.widgets) {
    (window as any).twttr.widgets.load();
  }
} 