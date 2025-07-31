import { User, Note } from '../types';
import './UserCard.css';
import { useState, useEffect } from 'react';

interface UserCardProps {
  user: User;
  onNoteClick: (note: Note) => void;
}

function UserCard({ user, onNoteClick }: UserCardProps) {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Reset image error state when component mounts or user changes
  useEffect(() => {
    setImageError(false);
    setRetryCount(0);
  }, [user.twitterHandle]);
  
  // Sort notes by timestamp (most recent first)
  const sortedNotes = [...user.notes].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Get unique nicknames and user types
  const uniqueNicknames = Array.from(new Set(user.notes.map(n => n.nickname || n.user).filter(Boolean)));
  const uniqueUserTypes = Array.from(new Set(user.notes.map(n => n.userType).filter(Boolean)));

  // Add timestamp to force cache refresh
  const getImageUrl = () => {
    if (imageError) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.twitterHandle)}&background=d4a574&color=fff&size=56`;
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
    <div className="user-card">
      <div className="user-header">
        <div className="user-avatar">
          <img 
            key={`${user.twitterHandle}-${retryCount}`} // Force re-render on retry
            src={getImageUrl()} 
            alt={`@${user.twitterHandle}`}
            onError={handleImageError}
          />
        </div>
        <div className="user-info">
          <a 
            href={`https://twitter.com/${user.twitterHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="user-handle"
          >
            @{user.twitterHandle}
          </a>
        </div>
      </div>
      
      <div className="user-badges">
        {sortedNotes.map((note, index) => (
          <div
            key={`${note.id}-${index}`}
            className="note-badge"
            onClick={() => onNoteClick(note)}
            title={`Note by ${note.cmName}`}
          >
            <img 
              src={note.iconUrl} 
              alt={`Icon`}
              className="badge-icon"
            />
          </div>
        ))}
      </div>
      
      <div className="user-meta">
        <div className="meta-item">
          <span className="meta-label">CM:</span>
          <span className="meta-value">{Array.from(new Set(user.notes.map(n => n.cmName))).join(', ')}</span>
        </div>
        
        {uniqueNicknames.length > 0 && (
          <div className="meta-item">
            <span className="meta-label">Nicknames:</span>
            <span className="meta-value">{uniqueNicknames.join(', ')}</span>
          </div>
        )}
        
        {uniqueUserTypes.length > 0 && (
          <div className="meta-item">
            <span className="meta-label">Types:</span>
            <span className="meta-value">{uniqueUserTypes.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCard; 