import { User } from '../types';
import './UserProfileCard.css';

interface UserProfileCardProps {
  user: User;
}

// Format timestamp like in CM's Note extension
function formatTimestamp(timestamp: number) {
  // Handle Unix timestamp (seconds)
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function UserProfileCard({ user }: UserProfileCardProps) {
  const latestNote = user.notes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
  
  return (
    <div className="user-profile-card">
      <div className="profile-avatar">
        <img 
          src={`https://unavatar.io/twitter/${user.twitterHandle}`} 
          alt={`@${user.twitterHandle}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.twitterHandle}&background=d4a574&color=fff`;
          }}
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