import { User, Note } from '../types';
import './UserCard.css';
import { useState, useEffect } from 'react';
import { ProfileImageCacheService } from '../services/profileImageCache';

interface UserCardProps {
  user: User;
  onNoteClick: (note: Note) => void;
}

function UserCard({ user, onNoteClick }: UserCardProps) {
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // First, try to get cached image (including fallback)
    const cachedImage = ProfileImageCacheService.getCachedImage(user.twitterHandle);
    
    if (cachedImage) {
      setProfileImageUrl(cachedImage);
      setIsLoading(false);
      
      // Always try to load actual image in background with forceRefresh
      ProfileImageCacheService.loadProfileImage(user.twitterHandle, true).then(newUrl => {
        if (newUrl !== cachedImage) {
          setProfileImageUrl(newUrl);
        }
      });
    } else {
      // No cache, show placeholder and load image
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.twitterHandle)}&background=d4a574&color=fff&size=56`;
      setProfileImageUrl(fallbackUrl);
      setIsLoading(false);
      
      // Load actual image (will try real image first, then cache the result)
      ProfileImageCacheService.loadProfileImage(user.twitterHandle).then(url => {
        setProfileImageUrl(url);
      });
    }
  }, [user.twitterHandle]);
  
  // Sort notes by timestamp (most recent first)
  const sortedNotes = [...user.notes].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Get unique nicknames and user types
  const uniqueNicknames = Array.from(new Set(user.notes.map(n => n.nickname || n.user).filter(Boolean)));
  const uniqueUserTypes = Array.from(new Set(user.notes.map(n => n.userType).filter(Boolean)));

  return (
    <div className="user-card">
      <div className="user-header">
        <div className="user-avatar">
          {profileImageUrl && (
            <img 
              src={profileImageUrl}
              alt={`@${user.twitterHandle}`}
              className={isLoading ? 'loading' : ''}
            />
          )}
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