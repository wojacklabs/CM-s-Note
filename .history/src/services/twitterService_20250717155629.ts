import { Tweet } from '../types';

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

// Mock function to get sample tweet URLs for users
// In production, you would need Twitter API to get actual latest tweets
export function getMockTweetURLsForUser(username: string): string[] {
  // These are example tweet URLs - in production, you'd fetch real tweet IDs
  const sampleTweetIds = [
    '1234567890123456789',
    '1234567890123456790',
    '1234567890123456791'
  ];
  
  // Return mock tweet URLs
  // In reality, you'd need to fetch actual tweet IDs from Twitter API
  return [`https://twitter.com/${username}/status/${sampleTweetIds[0]}`];
}

// Get embedded tweets for multiple users
export async function getEmbeddedTweetsForUsers(usernames: string[]): Promise<{ username: string; embedHTML: string | null; tweetUrl: string }[]> {
  const embeddedTweets = [];
  
  for (const username of usernames) {
    // In production, you'd fetch actual latest tweet URLs using Twitter API
    // For now, we'll show a placeholder message
    const tweetUrls = getMockTweetURLsForUser(username);
    
    for (const tweetUrl of tweetUrls) {
      // For demo purposes, we'll create a custom embed-like display
      // since we don't have actual tweet IDs
      const embedHTML = `
        <div class="twitter-embed-placeholder">
          <div class="embed-header">
            <img src="https://unavatar.io/twitter/${username}" alt="@${username}" />
            <div class="embed-author">
              <div class="author-name">@${username}</div>
              <div class="author-handle">Twitter User</div>
            </div>
          </div>
          <div class="embed-content">
            <p>To display real tweets, you need to:</p>
            <ol>
              <li>Get actual tweet IDs using Twitter API v2</li>
              <li>Or manually provide specific tweet URLs</li>
              <li>The oembed API will then return the actual embedded tweet HTML</li>
            </ol>
            <p>Example: https://twitter.com/${username}/status/[tweet_id]</p>
          </div>
          <div class="embed-footer">
            <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer">View on Twitter →</a>
          </div>
        </div>
      `;
      
      embeddedTweets.push({
        username,
        embedHTML,
        tweetUrl
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