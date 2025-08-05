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
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Reset error state when user changes
    setImageError(false);
    
    // First, try to get cached image info
    const cachedInfo = ProfileImageCacheService.getCachedImageInfo(user.twitterHandle);
    
    if (cachedInfo && !cachedInfo.isFallback) {
      setProfileImageUrl(cachedInfo.imageUrl);
      setIsLoading(false);
    } else {
      // Show fallback immediately
      const fallbackUrl = `https://ui-avatars.com/api/?name=${user.twitterHandle}&background=d4a574&color=fff`;
      setProfileImageUrl(fallbackUrl);
      setIsLoading(false);
      
      // Try to load real image in background
      ProfileImageCacheService.loadProfileImage(user.twitterHandle, !cachedInfo).then(url => {
        if (!url.includes('ui-avatars.com')) {
          setProfileImageUrl(url);
        }
      }).catch(error => {
        console.error(`[UserProfileCard] Error loading profile image for @${user.twitterHandle}:`, error);
      });
    }
  }, [user.twitterHandle]);
  
  const handleImageError = () => {
    if (!imageError && !profileImageUrl.includes('ui-avatars.com')) {
      setImageError(true);
      const fallbackUrl = `https://ui-avatars.com/api/?name=${user.twitterHandle}&background=d4a574&color=fff`;
      setProfileImageUrl(fallbackUrl);
      // Mark as fallback in cache
      ProfileImageCacheService.setCachedImage(user.twitterHandle, fallbackUrl, true, true);
    }
  };
  
  const latestNote = user.notes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
  
  return (
    <div className="user-profile-card">
      <div className="profile-avatar">
        {profileImageUrl && (
          <img 
            src={profileImageUrl}
            alt={`@${user.twitterHandle}`}
            className={isLoading ? 'loading' : ''}
            onError={handleImageError}
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