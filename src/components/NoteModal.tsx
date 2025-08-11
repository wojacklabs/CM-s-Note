import { useState, useEffect } from 'react';
import { Note } from '../types';
import { formatTimestamp } from '../utils/dateUtils';
import { loadNoteContent } from '../services/irysService';
import { ProfileImageCacheService } from '../services/profileImageCache';
import './NoteModal.css';

interface NoteModalProps {
  note: Note;
  onClose: () => void;
  onBack?: () => void; // Optional back button for navigation
}

function NoteModal({ note, onClose, onBack }: NoteModalProps) {
  const [content, setContent] = useState<string>(note.content || '');
  const [loadingContent, setLoadingContent] = useState<boolean>(!note.content);
  const [contentError, setContentError] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');

  // Prevent body scroll when modal is open
  useEffect(() => {
    // Save current body overflow style
    const originalOverflow = document.body.style.overflow;
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore body scroll
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Load profile image
  useEffect(() => {
    const loadProfileImage = async () => {
      const normalizedHandle = (note.twitterHandle.startsWith('@') ? 
        note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase();
      const imageUrl = await ProfileImageCacheService.loadProfileImage(normalizedHandle);
      setProfileImage(imageUrl);
    };
    loadProfileImage();
  }, [note.twitterHandle]);

  useEffect(() => {
    const loadContent = async () => {
      // If content is already loaded, use it immediately
      if (note.content) {
        setContent(note.content);
        setLoadingContent(false);
        return;
      }

      try {
        setLoadingContent(true);
        setContentError('');
        
        // Try to load content (might be from background loading or fresh load)
        const loadedContent = await loadNoteContent(note);
        setContent(loadedContent);
        
        // Update the original note object with loaded content
        note.content = loadedContent;
        
      } catch (error) {
        console.error('Error loading note content:', error);
        setContentError('Failed to load note content');
      } finally {
        setLoadingContent(false);
      }
    };

    loadContent();
  }, [note.id]);

  // Listen for changes in the note content (from background loading)
  useEffect(() => {
    if (note.content && note.content !== content) {
      setContent(note.content);
      setLoadingContent(false);
      setContentError('');
    }
  }, [note.content, content]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="note-modal-backdrop" onClick={handleBackdropClick}>
      <div className="note-modal">
        <div className="note-modal-header">
          {onBack ? (
            <button className="note-modal-back" onClick={onBack} title="Back">
              ←
            </button>
          ) : (
            <div className="note-modal-back invisible"></div>
          )}
          <h2>Note Details</h2>
          <button className="note-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="note-modal-content">
          <div className="note-detail-header">
            <img 
              src={profileImage || `https://unavatar.io/twitter/${note.twitterHandle}`} 
              alt={`@${note.twitterHandle}`} 
              className="note-detail-profile"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${note.twitterHandle}`;
              }}
            />
            <div className="note-detail-title">
              <h3>@{note.twitterHandle}</h3>
            </div>
          </div>
          
          {/* CM's nickname, badge, and note content as quote */}
          <div className="note-nickname-quote">
            {note.iconUrl && (
              <img 
                src={note.iconUrl} 
                alt="Badge" 
                className="note-badge-icon"
              />
            )}
            {note.nickname && (
              <p className="note-nickname-text">"{note.nickname}"</p>
            )}
            
            {/* Note Content */}
            <div className="note-content-section">
              {loadingContent ? (
                <div className="content-loading-inline">
                  <div className="loading-spinner-small"></div>
                  <span>Loading note content...</span>
                </div>
              ) : contentError ? (
                <div className="content-error-inline">
                  <p>{contentError}</p>
                </div>
              ) : (
                <div className="content-text-inline">
                  {content ? (
                    <p>{content}</p>
                  ) : (
                    <p className="no-content">No content available</p>
                  )}
                </div>
              )}
            </div>
            
            <p className="note-nickname-author">— {note.cmName}</p>
          </div>
          
          <div className="note-detail-meta">
            {note.userType && (
              <div className="meta-row">
                <span className="meta-label">User Type:</span>
                <span className="meta-value">{note.userType}</span>
              </div>
            )}
            <div className="meta-row">
              <span className="meta-label">Date:</span>
              <span className="meta-value">{formatTimestamp(note.timestamp)}</span>
            </div>
          </div>
          
          {note.dataUrl && (
            <div className="note-detail-footer">
              <a 
                href={note.dataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="view-irys-link"
              >
                View on Irys →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
    );
}

export default NoteModal; 