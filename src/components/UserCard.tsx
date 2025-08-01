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
          console.log(`[UserCard] Updated profile image for @${user.twitterHandle}: ${cachedInfo.imageUrl} -> ${newUrl}`);
          setProfileImageUrl(newUrl);
        }
      }).catch(error => {
        console.error(`[UserCard] Error loading profile image for @${user.twitterHandle}:`, error);
      });
    } else {
      // No cache, show placeholder and load image
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.twitterHandle)}&background=d4a574&color=fff&size=56`;
      setProfileImageUrl(fallbackUrl);
      setIsLoading(false);
      
      // Load actual image (will try real image first, then cache the result)
      ProfileImageCacheService.loadProfileImage(user.twitterHandle).then(url => {
        console.log(`[UserCard] Loaded profile image for @${user.twitterHandle}: ${url}`);
        setProfileImageUrl(url);
      }).catch(error => {
        console.error(`[UserCard] Error loading profile image for @${user.twitterHandle}:`, error);
      });
    }
  }, [user.twitterHandle]);
  
  // Sort notes by timestamp (most recent first)
  const sortedNotes = [...user.notes].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Get unique CMs with their Twitter handles
  const uniqueCMs = Array.from(
    new Map(
      user.notes.map(note => [note.cmName, { name: note.cmName, twitterHandle: note.cmTwitterHandle }])
    ).values()
  );

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
          <div className="cm-profiles">
            {uniqueCMs.map((cm, idx) => (
              <CMProfileImage key={idx} cmName={cm.name} cmTwitterHandle={cm.twitterHandle} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for CM profile images
function CMProfileImage({ cmName, cmTwitterHandle }: { cmName: string; cmTwitterHandle?: string }) {
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  
  useEffect(() => {
    if (!cmTwitterHandle) {
      // No Twitter handle, use avatar
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=32`;
      setProfileImageUrl(avatarUrl);
      return;
    }

    // Get cached image or load new one
    const cachedInfo = ProfileImageCacheService.getCachedImageInfo(cmTwitterHandle);
    
    if (cachedInfo) {
      setProfileImageUrl(cachedInfo.imageUrl);
      
      // Try to load actual image in background
      ProfileImageCacheService.loadProfileImage(cmTwitterHandle, true).then(newUrl => {
        if (newUrl !== cachedInfo.imageUrl) {
          setProfileImageUrl(newUrl);
        }
      });
    } else {
      // No cache, show placeholder and load image
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=32`;
      setProfileImageUrl(fallbackUrl);
      
      ProfileImageCacheService.loadProfileImage(cmTwitterHandle).then(url => {
        setProfileImageUrl(url);
      });
    }
  }, [cmTwitterHandle, cmName]);

  const handleClick = () => {
    if (cmTwitterHandle) {
      window.open(`https://twitter.com/${cmTwitterHandle}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="cm-profile-image" 
      onClick={handleClick}
      title={`${cmName}${cmTwitterHandle ? ` (@${cmTwitterHandle})` : ''}`}
      style={{ cursor: cmTwitterHandle ? 'pointer' : 'default' }}
    >
      {profileImageUrl && (
        <img 
          src={profileImageUrl}
          alt={cmName}
        />
      )}
    </div>
  );
}

export default UserCard; 