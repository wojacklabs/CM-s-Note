import { Note } from '../types';
import './CMCard.css';

interface CMInfo {
  cmName: string;
  cmTwitterHandle?: string;
  noteCount: number;
  recentUsers: Array<{
    twitterHandle: string;
    timestamp: number;
  }>;
}

interface CMCardProps {
  cmInfo: CMInfo;
  onNoteClick?: (note: Note) => void;
}

function CMCard({ cmInfo }: CMCardProps) {
  const { cmName, cmTwitterHandle, noteCount, recentUsers } = cmInfo;

  const cmProfileHandle = cmTwitterHandle || cmName;

  return (
    <div className="cm-card">
      <div className="cm-header">
        <div className="cm-avatar">
          <img 
            src={`https://unavatar.io/twitter/${cmProfileHandle}`}
            alt={cmName}
            onError={(e) => {
              // Fallback to avatar placeholder if Twitter image fails
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=64`;
            }}
          />
        </div>
        <div className="cm-info">
          <a 
            href={`https://twitter.com/${cmProfileHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cm-name-link"
          >
            <h3 className="cm-name">{cmName}</h3>
            {cmTwitterHandle && (
              <span className="cm-handle">@{cmTwitterHandle}</span>
            )}
          </a>
          <div className="cm-stats">
            <span className="note-count">{noteCount} notes</span>
          </div>
        </div>
      </div>
      
      <div className="cm-recent-users">
        <h4 className="recent-users-title">Recent Users</h4>
        <div className="recent-users-grid">
          {recentUsers.slice(0, 6).map((user, index) => (
            <a
              key={`${user.twitterHandle}-${index}`}
              href={`https://twitter.com/${user.twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="recent-user-item"
            >
              <img 
                src={`https://unavatar.io/twitter/${user.twitterHandle}`}
                alt={`@${user.twitterHandle}`}
                className="recent-user-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 
                    `https://ui-avatars.com/api/?name=${user.twitterHandle}&background=d4a574&color=fff&size=32`;
                }}
              />
              <span className="recent-user-handle">@{user.twitterHandle}</span>
            </a>
          ))}
        </div>
        {recentUsers.length > 6 && (
          <div className="more-users">
            +{recentUsers.length - 6} more
          </div>
        )}
      </div>
    </div>
  );
}

export default CMCard; 