import { User } from '../types';
import { formatTimestamp } from '../utils/dateUtils';
import './UserProfileCard.css';
import { useState, useEffect } from 'react';
import { ProfileImageCacheService } from '../services/profileImageCache';

interface UserProfileCardProps {
  user: User;
}

function UserProfileCard({ user }: UserProfileCardProps) {
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
      const fallbackUrl = `https://ui-avatars.com/api/?name=${user.twitterHandle}&background=d4a574&color=fff`;
      setProfileImageUrl(fallbackUrl);
      setIsLoading(false);
      
      // Load actual image (will try real image first, then cache the result)
      ProfileImageCacheService.loadProfileImage(user.twitterHandle).then(url => {
        setProfileImageUrl(url);
      });
    }
  }, [user.twitterHandle]);
  
  const latestNote = user.notes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
  
  return (
    <div className="user-profile-card">
      <div className="profile-avatar">
        {profileImageUrl && (
          <img 
            src={profileImageUrl}
            alt={`@${user.twitterHandle}`}
            className={isLoading ? 'loading' : ''}
          />
        )}
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