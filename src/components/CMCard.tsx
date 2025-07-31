import { Note } from '../types';
import { formatTimestamp } from '../utils/dateUtils';
import './CMCard.css';
import { useState, useEffect } from 'react';
import { ProfileImageCacheService } from '../services/profileImageCache';

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
}

function CMNotesModal({ cmInfo, onClose }: CMNotesModalProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleNoteClick = async (note: Note) => {
    setSelectedNote(note);
    
    // Load content if not already loaded
    if (!note.content) {
      setLoadingContent(true);
      try {
        const { loadNoteContent } = await import('../services/irysService');
        const content = await loadNoteContent(note);
        note.content = content;
      } catch (error) {
        console.error('Error loading note content:', error);
      } finally {
        setLoadingContent(false);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedNote(null);
  };

  return (
    <div className="cm-notes-modal-backdrop" onClick={handleBackdropClick}>
      <div className="cm-notes-modal">
        {!selectedNote ? (
          // Notes List View
          <>
            <div className="cm-notes-modal-header">
              <div className="cm-notes-modal-back invisible"></div>
              <h2>{cmInfo.cmName}'s Notes ({cmInfo.noteCount})</h2>
              <button className="cm-notes-modal-close" onClick={onClose}>×</button>
            </div>
            <div className="cm-notes-modal-content">
              {cmInfo.recentNotes.map((note, index) => (
                <div 
                  key={`${note.id}-${index}`} 
                  className="cm-note-item"
                  onClick={() => handleNoteClick(note)}
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
          </>
        ) : (
          // Note Detail View
          <>
            <div className="cm-notes-modal-header">
              <button className="cm-notes-modal-back" onClick={handleBackToList} title="Back to Notes List">
                ←
              </button>
              <h2>Note Details</h2>
              <button className="cm-notes-modal-close" onClick={onClose}>×</button>
            </div>
            <div className="cm-notes-modal-content note-detail-view">
              <div className="note-detail-header">
                <img 
                  src={selectedNote.iconUrl} 
                  alt="Note icon" 
                  className="note-detail-icon"
                />
                <div className="note-detail-title">
                  <h3>{selectedNote.nickname || selectedNote.user}</h3>
                  <p className="note-detail-subtitle">@{selectedNote.twitterHandle}</p>
                </div>
              </div>
              
              <div className="note-detail-meta">
                <div className="meta-row">
                  <span className="meta-label">CM:</span>
                  <span className="meta-value">{selectedNote.cmName}</span>
                </div>
                {selectedNote.userType && (
                  <div className="meta-row">
                    <span className="meta-label">User Type:</span>
                    <span className="meta-value">{selectedNote.userType}</span>
                  </div>
                )}
                <div className="meta-row">
                  <span className="meta-label">Project:</span>
                  <span className="meta-value">{selectedNote.project}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Date:</span>
                  <span className="meta-value">{formatTimestamp(selectedNote.timestamp)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Status:</span>
                  <span className={`meta-value status-${selectedNote.status}`}>
                    {selectedNote.status}
                  </span>
                </div>
              </div>
              
              <div className="note-detail-content">
                <h4>Note Content:</h4>
                {loadingContent ? (
                  <div className="content-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading note content...</p>
                  </div>
                ) : (
                  <div className="content-text">
                    {selectedNote.content ? (
                      <p>{selectedNote.content}</p>
                    ) : (
                      <p className="no-content">No content available</p>
                    )}
                  </div>
                )}
              </div>
              
              {selectedNote.dataUrl && (
                <div className="note-detail-footer">
                  <a 
                    href={selectedNote.dataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-irys-link"
                  >
                    View on Irys →
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CMCard({ cmInfo, onNoteClick }: CMCardProps) {
  const { cmName, cmTwitterHandle, noteCount, recentUsers, recentNotes } = cmInfo;
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!cmTwitterHandle) {
      // No Twitter handle, use avatar directly
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=64`;
      setProfileImageUrl(avatarUrl);
      setIsLoading(false);
      return;
    }

    // First, try to get cached image (including fallback)
    const cachedImage = ProfileImageCacheService.getCachedImage(cmTwitterHandle);
    
    if (cachedImage) {
      setProfileImageUrl(cachedImage);
      setIsLoading(false);
      
      // Always try to load actual image in background with forceRefresh
      ProfileImageCacheService.loadProfileImage(cmTwitterHandle, true).then(newUrl => {
        if (newUrl !== cachedImage) {
          setProfileImageUrl(newUrl);
        }
      });
    } else {
      // No cache, show placeholder and load image
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(cmName)}&background=d4a574&color=fff&size=64`;
      setProfileImageUrl(fallbackUrl);
      setIsLoading(false);
      
      // Load actual image (will try real image first, then cache the result)
      ProfileImageCacheService.loadProfileImage(cmTwitterHandle).then(url => {
        setProfileImageUrl(url);
      });
    }
  }, [cmTwitterHandle, cmName]);

  // 디버깅: CM 정보 로그
  console.log(`[CMCard] CM: ${cmName}, Twitter Handle: ${cmTwitterHandle}`);

  return (
    <>
      <div className="cm-card">
        <div className="cm-header">
          <div className="cm-avatar">
            {profileImageUrl && (
              <img 
                src={profileImageUrl}
                alt={cmName}
                className={isLoading ? 'loading' : ''}
              />
            )}
          </div>
          <div className="cm-info">
            <a 
              href={cmTwitterHandle ? `https://twitter.com/${cmTwitterHandle}` : '#'}
              target={cmTwitterHandle ? "_blank" : "_self"}
              rel={cmTwitterHandle ? "noopener noreferrer" : ""}
              className={`cm-name-link ${!cmTwitterHandle ? 'no-link' : ''}`}
              onClick={!cmTwitterHandle ? (e) => e.preventDefault() : undefined}
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
        <div className="cm-recent-notes">
          <h4 className="recent-notes-title">Recent Notes</h4>
          {recentNotes.length > 0 ? (
            <>
              <div className="cm-notes-list">
                {recentNotes.slice(0, 4).map((note, index) => (
                  <div 
                    key={`${note.id}-${index}`} 
                    className="cm-note-preview"
                    onClick={() => onNoteClick?.(note)}
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
            </>
          ) : (
            <div className="cm-no-notes">
              <p>No notes found</p>
            </div>
          )}
        </div>
        
        <div className="cm-recent-users">
          <h4 className="recent-users-title">Recent Users</h4>
          {recentUsers.length > 0 ? (
            <>
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
            </>
          ) : (
            <div className="cm-no-users">
              <p>No recent users</p>
            </div>
          )}
        </div>
      </div>
      
      {showNotesModal && (
        <CMNotesModal
          cmInfo={cmInfo}
          onClose={() => setShowNotesModal(false)}
        />
      )}
    </>
  );
}

export default CMCard; 