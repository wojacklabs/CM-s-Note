import { Tweet } from '../types';

// Mock Twitter data for demonstration
// In production, you would need to use Twitter API v2 with proper authentication
export async function getUserTweets(username: string): Promise<Tweet[]> {
  // Mock data - replace with actual Twitter API call
  const mockTweets: Tweet[] = [
    {
      id: '1',
      text: `This is a sample tweet from @${username}. In production, this would fetch real tweets using Twitter API.`,
      author_id: '123',
      created_at: new Date().toISOString(),
      author: {
        name: username,
        username: username,
        profile_image_url: `https://ui-avatars.com/api/?name=${username}&background=random`
      }
    },
    {
      id: '2',
      text: `Another tweet example. Twitter API requires authentication to fetch real tweets.`,
      author_id: '123',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      author: {
        name: username,
        username: username,
        profile_image_url: `https://ui-avatars.com/api/?name=${username}&background=random`
      }
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockTweets;
}

// Get tweets for multiple users
export async function getMultipleUsersTweets(usernames: string[]): Promise<Tweet[]> {
  const allTweets: Tweet[] = [];
  
  for (const username of usernames) {
    const tweets = await getUserTweets(username);
    allTweets.push(...tweets);
  }
  
  // Sort by created_at
  return allTweets.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// Note: To use real Twitter data, you would need to:
// 1. Set up Twitter API v2 authentication
// 2. Use Bearer Token or OAuth 2.0
// 3. Call the Twitter API endpoints like:
//    GET /2/users/by/username/:username/tweets
// 4. Handle rate limiting and errors properly 