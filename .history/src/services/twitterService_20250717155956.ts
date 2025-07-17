import { Tweet } from '../types';
import { getRealTweetURLsForUser } from './exampleTweetData';

// Get Twitter embed HTML using oembed API
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

// Get tweet URLs for a user
export function getTweetURLsForUser(username: string): string[] {
  // First check if we have real tweet URLs in our example data
  const realTweetUrls = getRealTweetURLsForUser(username);
  if (realTweetUrls.length > 0) {
    return realTweetUrls;
  }
  
  // Otherwise return empty array - in production you'd fetch from Twitter API
  return [];
}

// Get embedded tweets for multiple users
export async function getEmbeddedTweetsForUsers(usernames: string[]): Promise<{ username: string; embedHTML: string | null; tweetUrl: string }[]> {
  const embeddedTweets = [];
  
  for (const username of usernames) {
    const tweetUrls = getTweetURLsForUser(username);
    
    if (tweetUrls.length > 0) {
      // We have real tweet URLs, fetch the embed HTML
      for (const tweetUrl of tweetUrls) {
        const embedHTML = await getTwitterEmbedHTML(tweetUrl);
        if (embedHTML) {
          embeddedTweets.push({
            username,
            embedHTML,
            tweetUrl
          });
        }
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
            <p>To display tweets for @${username}:</p>
            <ol>
              <li>Find a recent tweet URL from this user</li>
              <li>Add it to <code>src/services/exampleTweetData.ts</code></li>
              <li>Or use Twitter API to fetch latest tweets automatically</li>
            </ol>
            <p>Example URL format: <code>https://twitter.com/${username}/status/[tweet_id]</code></p>
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