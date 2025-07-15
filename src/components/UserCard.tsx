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

  // Get unique CMs with their Twitter handles (deduplicated by handle or name)
  const uniqueCMs = Array.from(
    new Map<string, { name: string; twitterHandle?: string }>(
      user.notes
        .map(note => {
          if (note.cmTwitterHandle) {
            // If we have a Twitter handle, use it as the key
            const normalizedHandle = (note.cmTwitterHandle.startsWith('@') ? 
              note.cmTwitterHandle.substring(1) : note.cmTwitterHandle).toLowerCase();
            return [normalizedHandle, { name: note.cmName, twitterHandle: note.cmTwitterHandle }];
          } else {
            // If no Twitter handle, use the CM name as the key
            return [note.cmName.toLowerCase(), { name: note.cmName, twitterHandle: undefined }];
          }
        })
    ).values()
  );
  
  // Check if this user is a CM by comparing displayName
  // If displayName is different from twitterHandle and doesn't contain '@', it's likely a CM name
  const isCM = user.displayName !== user.twitterHandle && !user.displayName.includes('@');
  const userNickname = isCM ? user.displayName : null;
  
  // Debug logging
  useEffect(() => {
    console.log(`[UserCard] User @${user.twitterHandle} has ${user.notes.length} notes from ${uniqueCMs.length} unique CMs`);
    
    // Log all CM names in notes
    const allCMNames = user.notes.map(note => `${note.cmName} (${note.cmTwitterHandle || 'no handle'})`);
    console.log(`[UserCard] All CMs in notes: ${allCMNames.join(', ')}`);
    
    // Log unique CMs
    uniqueCMs.forEach(cm => {
      console.log(`[UserCard] Unique CM: ${cm.name}, Twitter: ${cm.twitterHandle || 'N/A'}`);
    });
  }, [user.twitterHandle, user.notes.length]);

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
          {userNickname && (
            <div className="user-nickname">{userNickname}</div>
          )}
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

    // Load image (will use cache if available)
    const loadImage = async () => {
      try {
        // Always try to load with the same logic as other components
        const url = await ProfileImageCacheService.loadProfileImage(cmTwitterHandle, false);
        setProfileImageUrl(url);
        
        // If we got a fallback, try to refresh in background
        if (url.includes('ui-avatars.com')) {
          ProfileImageCacheService.loadProfileImage(cmTwitterHandle, true).then(newUrl => {
            if (newUrl !== url && !newUrl.includes('ui-avatars.com')) {
              console.log(`[CMProfileImage] Updated image for @${cmTwitterHandle}`);
              setProfileImageUrl(newUrl);
            }
          });
        }
      } catch (error) {
        console.error(`[CMProfileImage] Error loading image for @${cmTwitterHandle}:`, error);
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=56`;
        setProfileImageUrl(fallbackUrl);
      }
    };
    
    loadImage();
  }, [cmTwitterHandle, cmName]);

  const handleClick = () => {
    if (cmTwitterHandle) {
      window.open(`https://twitter.com/${cmTwitterHandle}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=56`;
      setProfileImageUrl(fallbackUrl);
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