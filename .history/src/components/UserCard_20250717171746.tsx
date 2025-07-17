import { User, Note } from '../types';
import './UserCard.css';

interface UserCardProps {
  user: User;
  onNoteClick: (note: Note) => void;
}

function UserCard({ user, onNoteClick }: UserCardProps) {
  // Group notes by CM to avoid duplicates
  const notesByCM = new Map<string, Note[]>();
  
  user.notes.forEach(note => {
    const key = `${note.cmName}-${note.iconUrl}`;
    if (!notesByCM.has(key)) {
      notesByCM.set(key, []);
    }
    notesByCM.get(key)!.push(note);
  });

  // Get unique nicknames and user types
  const uniqueNicknames = Array.from(new Set(user.notes.map(n => n.nickname || n.user).filter(Boolean)));
  const uniqueUserTypes = Array.from(new Set(user.notes.map(n => n.userType).filter(Boolean)));

  return (
    <div className="user-card">
      <div className="user-header">
        <div className="user-avatar">
          <img 
            src={`https://unavatar.io/twitter/${user.twitterHandle}`} 
            alt={`@${user.twitterHandle}`}
            onError={(e) => {
              // Fallback to avatar placeholder if Twitter image fails
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.twitterHandle}&background=d4a574&color=fff`;
            }}
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
        {Array.from(notesByCM.values()).map((notes, index) => {
          const latestNote = notes.sort((a, b) => b.timestamp - a.timestamp)[0];
          return (
            <div
              key={`${latestNote.cmName}-${latestNote.iconUrl}-${index}`}
              className="note-badge"
              onClick={() => onNoteClick(latestNote)}
              title={`Note by ${latestNote.cmName}`}
            >
              <img 
                src={latestNote.iconUrl} 
                alt={`Icon`}
                className="badge-icon"
              />
              {notes.length > 1 && (
                <span className="badge-count">{notes.length}</span>
              )}
            </div>
          );
        })}
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