import { useState } from 'react';
import { Note } from '../types';
import { formatTimestamp } from '../utils/dateUtils';
import NoteModal from './NoteModal';
import './CMCard.css';

interface CMInfo {
  cmName: string;
  cmTwitterHandle?: string;
  noteCount: number;
  recentUsers: Array<{
    twitterHandle: string;
    timestamp: number;
  }>;
  recentNotes: Note[];
}

interface CMCardProps {
  cmInfo: CMInfo;
  onNoteClick?: (note: Note) => void;
}

// CM Notes Modal Component
interface CMNotesModalProps {
  cmInfo: CMInfo;
  onClose: () => void;
  onNoteClick?: (note: Note) => void;
}

function CMNotesModal({ cmInfo, onClose, onNoteClick }: CMNotesModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="cm-notes-modal-backdrop" onClick={handleBackdropClick}>
      <div className="cm-notes-modal">
        <div className="cm-notes-modal-header">
          <h2>{cmInfo.cmName}'s Notes ({cmInfo.noteCount})</h2>
          <button className="cm-notes-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="cm-notes-modal-content">
          {cmInfo.recentNotes.map((note, index) => (
            <div 
              key={`${note.id}-${index}`} 
              className="cm-note-item"
              onClick={() => onNoteClick?.(note)}
            >
              <div className="cm-note-user">
                <img 
                  src={`https://unavatar.io/twitter/${note.twitterHandle}`}
                  alt={note.twitterHandle}
                  className="cm-note-user-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 
                      `https://ui-avatars.com/api/?name=${note.twitterHandle}&background=d4a574&color=fff&size=32`;
                  }}
                />
                <div className="cm-note-user-info">
                  <span className="cm-note-user-handle">@{note.twitterHandle}</span>
                  <span className="cm-note-timestamp">{formatTimestamp(note.timestamp)}</span>
                </div>
              </div>
              {note.iconUrl && (
                <div className="cm-note-icon">
                  <img src={note.iconUrl} alt="Project Icon" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CMCard({ cmInfo, onNoteClick }: CMCardProps) {
  const { cmName, cmTwitterHandle, noteCount, recentUsers, recentNotes } = cmInfo;
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const cmProfileHandle = cmTwitterHandle || cmName;

  // Handle note click from preview or modal
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    // Don't close showNotesModal - keep it for back navigation
    onNoteClick?.(note); // Also call the parent handler if provided
  };

  // Handle back from note detail to notes list
  const handleBackToNotesList = () => {
    setSelectedNote(null);
    setShowNotesModal(true);
  };

  return (
    <>
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
        
        {/* Recent Notes Section */}
        {recentNotes.length > 0 && (
          <div className="cm-recent-notes">
            <h4 className="recent-notes-title">Recent Notes</h4>
            <div className="cm-notes-list">
              {recentNotes.slice(0, 4).map((note, index) => (
                <div 
                  key={`${note.id}-${index}`} 
                  className="cm-note-preview"
                  onClick={() => handleNoteClick(note)}
                >
                  <div className="cm-note-preview-user">
                    <img 
                      src={`https://unavatar.io/twitter/${note.twitterHandle}`}
                      alt={note.twitterHandle}
                      className="cm-note-preview-avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 
                          `https://ui-avatars.com/api/?name=${note.twitterHandle}&background=d4a574&color=fff&size=24`;
                      }}
                    />
                    <div className="cm-note-preview-info">
                      <span className="cm-note-preview-handle">@{note.twitterHandle}</span>
                      <span className="cm-note-preview-time">{formatTimestamp(note.timestamp)}</span>
                    </div>
                  </div>
                  {note.iconUrl && (
                    <div className="cm-note-preview-icon">
                      <img src={note.iconUrl} alt="Icon" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {recentNotes.length > 4 && (
              <button 
                className="cm-show-more-notes"
                onClick={() => setShowNotesModal(true)}
              >
                Show More ({recentNotes.length - 4} more)
              </button>
            )}
          </div>
        )}
        
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
      
      {showNotesModal && !selectedNote && (
        <CMNotesModal
          cmInfo={cmInfo}
          onClose={() => setShowNotesModal(false)}
          onNoteClick={handleNoteClick}
        />
      )}
      
      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() => {
            setSelectedNote(null);
            setShowNotesModal(false);
          }}
          onBack={showNotesModal ? handleBackToNotesList : undefined}
        />
      )}
    </>
  );
}

export default CMCard; 