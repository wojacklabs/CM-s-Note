import { useState, useEffect } from 'react';
import { Note } from '../types';
import { formatTimestamp } from '../utils/dateUtils';
import { loadNoteContent } from '../services/irysService';
import './NoteModal.css';

interface NoteModalProps {
  note: Note;
  onClose: () => void;
}

function NoteModal({ note, onClose }: NoteModalProps) {
  const [content, setContent] = useState<string>(note.content || '');
  const [loadingContent, setLoadingContent] = useState<boolean>(!note.content);
  const [contentError, setContentError] = useState<string>('');

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        
        <div className="modal-header">
          <img 
            src={note.iconUrl} 
            alt="Note icon" 
            className="modal-icon"
          />
          <div className="modal-title">
            <h3>{note.nickname || note.user}</h3>
            <p className="modal-subtitle">@{note.twitterHandle}</p>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="note-meta">
            <div className="meta-row">
              <span className="meta-label">CM:</span>
              <span className="meta-value">{note.cmName}</span>
            </div>
            {note.userType && (
              <div className="meta-row">
                <span className="meta-label">User Type:</span>
                <span className="meta-value">{note.userType}</span>
              </div>
            )}
            <div className="meta-row">
              <span className="meta-label">Project:</span>
              <span className="meta-value">{note.project}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Date:</span>
              <span className="meta-value">{formatTimestamp(note.timestamp)}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Status:</span>
              <span className={`meta-value status-${note.status}`}>
                {note.status}
              </span>
            </div>
          </div>
          
          <div className="note-content">
            <h4>Note Content:</h4>
            {loadingContent ? (
              <div className="content-loading">
                <div className="loading-spinner"></div>
                <p>Loading note content...</p>
              </div>
            ) : contentError ? (
              <div className="content-error">
                <p>{contentError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="retry-button"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="content-text">
                {content ? (
                  <p>{content}</p>
                ) : (
                  <p className="no-content">No content available</p>
                )}
              </div>
            )}
          </div>
          
          {note.dataUrl && (
            <div className="note-footer">
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