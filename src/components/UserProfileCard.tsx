import { User } from '../types';
import { formatTimestamp } from '../utils/dateUtils';
import './UserProfileCard.css';

interface UserProfileCardProps {
  user: User;
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