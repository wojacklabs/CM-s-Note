import { User } from '../types';
import { formatTimestamp } from '../utils/dateUtils';
import './UserProfileCard.css';
import { useState, useEffect } from 'react';

interface UserProfileCardProps {
  user: User;
}

function UserProfileCard({ user }: UserProfileCardProps) {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Reset image error state when component mounts or user changes
  useEffect(() => {
    setImageError(false);
    setRetryCount(0);
  }, [user.twitterHandle]);
  
  const latestNote = user.notes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
  
  // Add timestamp to force cache refresh
  const getImageUrl = () => {
    if (imageError) {
      return `https://ui-avatars.com/api/?name=${user.twitterHandle}&background=d4a574&color=fff`;
    }
    // Add a retry parameter to bypass cache on retries
    const retryParam = retryCount > 0 ? `&retry=${retryCount}` : '';
    return `https://unavatar.io/twitter/${user.twitterHandle}?t=${Date.now()}${retryParam}`;
  };

  const handleImageError = () => {
    if (retryCount < 2) {
      // Retry up to 2 times
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000); // Wait 1 second before retry
    } else {
      // After 2 retries, use fallback
      setImageError(true);
    }
  };
  
  return (
    <div className="user-profile-card">
      <div className="profile-avatar">
        <img 
          key={`${user.twitterHandle}-${retryCount}`} // Force re-render on retry
          src={getImageUrl()} 
          alt={`@${user.twitterHandle}`}
          onError={handleImageError}
        />
      </div>
      
      <div className="profile-info">
        <a 
          href={`https://twitter.com/${user.twitterHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-handle"
        >
          @{user.twitterHandle}
        </a>
        
        <div className="profile-meta">
          <span className="note-count">{user.notes.length} notes</span>
          <span className="last-noted">{formatTimestamp(latestNote.timestamp)}</span>
        </div>
        
        <div className="profile-badges">
          {user.notes.slice(0, 3).map((note, index) => (
            <img 
              key={`${note.id}-${index}`}
              src={note.iconUrl} 
              alt="Badge"
              className="profile-badge"
            />
          ))}
          {user.notes.length > 3 && (
            <span className="more-badges">+{user.notes.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfileCard; 