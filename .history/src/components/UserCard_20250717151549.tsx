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

  return (
    <div className="user-card">
      <div className="user-header">
        <div className="user-avatar">
          <img 
            src={`https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
            alt={user.displayName}
          />
        </div>
        <div className="user-info">
          <h3 className="user-name">{user.displayName}</h3>
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
      
      {user.notes.length > 0 && (
        <div className="user-meta">
          <span className="meta-item">
            CM: {Array.from(new Set(user.notes.map(n => n.cmName))).join(', ')}
          </span>
          {user.notes[0].userType && (
            <span className="meta-item">
              Type: {user.notes[0].userType}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default UserCard; 