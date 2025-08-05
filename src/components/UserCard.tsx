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
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.twitterHandle)}&background=d4a574&color=fff&size=56`;
      setProfileImageUrl(fallbackUrl);
      setIsLoading(false);
      
      // Try to load real image in background
      ProfileImageCacheService.loadProfileImage(user.twitterHandle, !cachedInfo).then(url => {
        if (!url.includes('ui-avatars.com')) {
          setProfileImageUrl(url);
        }
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
  
  // Debug logging
  useEffect(() => {
    console.log(`[UserCard] User @${user.twitterHandle} has ${uniqueCMs.length} unique CMs:`, uniqueCMs);
    uniqueCMs.forEach(cm => {
      console.log(`[UserCard] CM: ${cm.name}, Twitter: ${cm.twitterHandle || 'N/A'}`);
    });
  }, [user.twitterHandle, uniqueCMs]);

  const handleImageError = () => {
    if (!imageError && !profileImageUrl.includes('ui-avatars.com')) {
      setImageError(true);
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.twitterHandle)}&background=d4a574&color=fff&size=56`;
      setProfileImageUrl(fallbackUrl);
      // Mark as fallback in cache
      ProfileImageCacheService.setCachedImage(user.twitterHandle, fallbackUrl, true, true);
    }
  };

  return (
    <div className="user-card">
      <div className="user-header">
        <div className="user-avatar">
          {profileImageUrl && (
            <img 
              src={profileImageUrl}
              alt={`@${user.twitterHandle}`}
              className={isLoading ? 'loading' : ''}
              onError={handleImageError}
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
          <span className="meta-label">Sent By:</span>
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
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Reset error state when props change
    setImageError(false);
    
    if (!cmTwitterHandle) {
      // No Twitter handle, use avatar
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=56`;
      setProfileImageUrl(avatarUrl);
      return;
    }

    // Start with fallback
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=56`;
    setProfileImageUrl(fallbackUrl);
    
    // Load image (will use cache if available)
    ProfileImageCacheService.loadProfileImage(cmTwitterHandle, false).then(url => {
      if (!url.includes('ui-avatars.com')) {
        setProfileImageUrl(url);
      }
    }).catch(error => {
      console.error(`[CMProfileImage] Error loading image for @${cmTwitterHandle}:`, error);
    });
  }, [cmTwitterHandle, cmName]);

  const handleClick = () => {
    if (cmTwitterHandle) {
      window.open(`https://twitter.com/${cmTwitterHandle}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImageError = () => {
    if (!imageError && !profileImageUrl.includes('ui-avatars.com')) {
      setImageError(true);
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=56`;
      setProfileImageUrl(fallbackUrl);
      if (cmTwitterHandle) {
        ProfileImageCacheService.setCachedImage(cmTwitterHandle, fallbackUrl, true, true);
      }
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
          onError={handleImageError}
        />
      )}
    </div>
  );
}

export default UserCard; 