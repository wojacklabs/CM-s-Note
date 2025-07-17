import { useEffect, useState } from 'react';
import './LatestTweet.css';

type Tweet = {
  title: string;
  link: string;
  pubDate: string;
};

interface LatestTweetProps {
  username: string;
}

export function LatestTweet({ username }: LatestTweetProps) {
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `/api/nitter/${username}/rss`;
    
    console.log(`Fetching RSS for ${username} from:`, url);
    
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.text();
      })
      .then((xmlText) => {
        console.log(`Raw XML response for ${username}:`, xmlText.substring(0, 200) + '...');
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
          throw new Error('XML parsing error');
        }
        
        const item = xmlDoc.querySelector('item');
        if (!item) throw new Error('No <item> found in RSS');
        
        const title = item.querySelector('title')?.textContent || '';
        let link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        
        if (!link) throw new Error('No link found in RSS item');
        
        // Convert Nitter URL to Twitter URL
        link = link.replace('https://nitter.net', 'https://twitter.com');
        
        console.log(`Successfully parsed tweet for ${username}:`, { title, link, pubDate });
        
        setTweet({ title, link, pubDate });
        setError(null);
      })
      .catch((err) => {
        console.error(`Error fetching tweet for ${username}:`, err);
        setError(err.message);
        setTweet(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return (
      <div className="latest-tweet loading">
        <div className="loading-spinner"></div>
        <span>Loading tweet for @{username}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="latest-tweet error">
        <div className="error-icon">❗️</div>
        <div className="error-content">
          <strong>Error loading tweet for @{username}</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!tweet) {
    return (
      <div className="latest-tweet no-tweet">
        <div className="no-tweet-icon">🤷</div>
        <span>No tweets found for @{username}</span>
      </div>
    );
  }

  return (
    <div className="latest-tweet">
      <div className="tweet-header">
        <img 
          src={`https://unavatar.io/twitter/${username}`} 
          alt={`@${username}`}
          className="tweet-avatar"
        />
        <div className="tweet-author">
          <strong>@{username}</strong>
          <span className="tweet-time">
            {new Date(tweet.pubDate).toLocaleString('ko-KR')}
          </span>
        </div>
      </div>
      
      <blockquote className="tweet-content">
        <a href={tweet.link} target="_blank" rel="noopener noreferrer">
          {tweet.title}
        </a>
      </blockquote>
      
      <div className="tweet-footer">
        <a href={tweet.link} target="_blank" rel="noopener noreferrer">
          View on Twitter →
        </a>
      </div>
    </div>
  );
} 