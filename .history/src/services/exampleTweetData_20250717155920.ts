// Example of how to use real Twitter embed URLs
// Replace these with actual tweet URLs from the users in your CM notes

export const exampleTweetURLs: { [username: string]: string[] } = {
  // Example format:
  // 'username': ['https://twitter.com/username/status/tweetId'],
  
  'elonmusk': [
    'https://twitter.com/elonmusk/status/1234567890123456789'
  ],
  'vitalikbuterin': [
    'https://twitter.com/VitalikButerin/status/1234567890123456789'
  ],
  // Add more users and their tweet URLs here
};

// Function to get real tweet URLs for a user
export function getRealTweetURLsForUser(username: string): string[] {
  return exampleTweetURLs[username.toLowerCase()] || [];
}

// Example of how to fetch latest tweet IDs using Twitter API v2
// This requires authentication and API access
/*
async function fetchLatestTweetIds(username: string): Promise<string[]> {
  // This would require Twitter API v2 Bearer Token
  const response = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}/tweets?max_results=5`,
    {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
      }
    }
  );
  
  const data = await response.json();
  return data.data.map((tweet: any) => tweet.id);
}
*/ 