import { Note } from '../types';
import './NoteModal.css';

interface NoteModalProps {
  note: Note;
  onClose: () => void;
}

function NoteModal({ note, onClose }: NoteModalProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

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
              <span className="meta-value">{formatDate(note.timestamp)}</span>
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
            <p>{note.content}</p>
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