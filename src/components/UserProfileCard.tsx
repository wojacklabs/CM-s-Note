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
    // First, try to get cached image info
    const cachedInfo = ProfileImageCacheService.getCachedImageInfo(user.twitterHandle);
    
    if (cachedInfo) {
      setProfileImageUrl(cachedInfo.imageUrl);
      setIsLoading(false);
      
      // Always try to load actual image in background
      // This is especially important for fallback images
      ProfileImageCacheService.loadProfileImage(user.twitterHandle, true).then(newUrl => {
        // Update if we got a different (better) image
        if (newUrl !== cachedInfo.imageUrl) {
          console.log(`[UserProfileCard] Updated profile image for @${user.twitterHandle}: ${cachedInfo.imageUrl} -> ${newUrl}`);
          setProfileImageUrl(newUrl);
        }
      }).catch(error => {
        console.error(`[UserProfileCard] Error loading profile image for @${user.twitterHandle}:`, error);
      });
    } else {
      // No cache, show placeholder and load image
      const fallbackUrl = `https://ui-avatars.com/api/?name=${user.twitterHandle}&background=d4a574&color=fff`;
      setProfileImageUrl(fallbackUrl);
      setIsLoading(false);
      
      // Load actual image (will try real image first, then cache the result)
      ProfileImageCacheService.loadProfileImage(user.twitterHandle).then(url => {
        console.log(`[UserProfileCard] Loaded profile image for @${user.twitterHandle}: ${url}`);
        setProfileImageUrl(url);
      }).catch(error => {
        console.error(`[UserProfileCard] Error loading profile image for @${user.twitterHandle}:`, error);
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