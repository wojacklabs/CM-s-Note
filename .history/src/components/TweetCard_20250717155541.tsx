import { Tweet } from '../types';
import './TweetCard.css';

interface TweetCardProps {
  tweet: Tweet;
}

function TweetCard({ tweet }: TweetCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 1 minute
    if (diff < 60000) return 'just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m`;
    }
    
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h`;
    }
    
    // More than 1 day
    const days = Math.floor(diff / 86400000);
    if (days < 7) return `${days}d`;
    
    // Show full date
    return date.toLocaleDateString();
  };

  return (
    <div className="tweet-card">
      <div className="tweet-header">
        <img 
          src={tweet.author.profile_image_url || `https://ui-avatars.com/api/?name=${tweet.author.name}&background=random`}
          alt={tweet.author.name}
          className="tweet-avatar"
        />
        <div className="tweet-author">
          <div className="author-name">{tweet.author.name}</div>
          <div className="author-handle">@{tweet.author.username}</div>
        </div>
        <div className="tweet-time">
          {formatDate(tweet.created_at)}
        </div>
      </div>
      
      <div className="tweet-content">
        {tweet.text}
      </div>
      
      <div className="tweet-footer">
        <a 
          href={`https://twitter.com/${tweet.author.username}/status/${tweet.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="view-tweet-link"
        >
          View on Twitter →
        </a>
      </div>
    </div>
  );
}

export default TweetCard; 