import './SkeletonCard.css';

export function UserCardSkeleton() {
  return (
    <div className="skeleton-card user-card-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-info">
          <div className="skeleton-text skeleton-handle"></div>
        </div>
      </div>
      
      <div className="skeleton-badges">
        <div className="skeleton-badge"></div>
        <div className="skeleton-badge"></div>
        <div className="skeleton-badge"></div>
        <div className="skeleton-badge"></div>
      </div>
      
      <div className="skeleton-meta">
        <div className="skeleton-meta-item">
          <div className="skeleton-text skeleton-label"></div>
          <div className="skeleton-text skeleton-value"></div>
        </div>
        <div className="skeleton-meta-item">
          <div className="skeleton-text skeleton-label"></div>
          <div className="skeleton-text skeleton-value"></div>
        </div>
        <div className="skeleton-meta-item">
          <div className="skeleton-text skeleton-label"></div>
          <div className="skeleton-text skeleton-value"></div>
        </div>
      </div>
    </div>
  );
}

export function CMCardSkeleton() {
  return (
    <div className="skeleton-card cm-card-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-avatar skeleton-cm-avatar"></div>
        <div className="skeleton-info">
          <div className="skeleton-text skeleton-name"></div>
          <div className="skeleton-text skeleton-handle"></div>
          <div className="skeleton-stats">
            <div className="skeleton-text skeleton-note-count"></div>
          </div>
        </div>
      </div>
      
      <div className="skeleton-recent-notes">
        <div className="skeleton-text skeleton-section-title"></div>
        <div className="skeleton-notes-list">
          <div className="skeleton-note-preview"></div>
          <div className="skeleton-note-preview"></div>
          <div className="skeleton-note-preview"></div>
        </div>
      </div>
      
      <div className="skeleton-recent-users">
        <div className="skeleton-text skeleton-section-title"></div>
        <div className="skeleton-users-grid">
          <div className="skeleton-user-item"></div>
          <div className="skeleton-user-item"></div>
          <div className="skeleton-user-item"></div>
          <div className="skeleton-user-item"></div>
          <div className="skeleton-user-item"></div>
          <div className="skeleton-user-item"></div>
        </div>
      </div>
    </div>
  );
}

export function UserProfileCardSkeleton() {
  return (
    <div className="skeleton-card user-profile-skeleton">
      <div className="skeleton-profile-avatar"></div>
      <div className="skeleton-profile-info">
        <div className="skeleton-text skeleton-profile-handle"></div>
        <div className="skeleton-profile-meta">
          <div className="skeleton-text skeleton-note-count"></div>
          <div className="skeleton-text skeleton-last-noted"></div>
        </div>
        <div className="skeleton-profile-badges">
          <div className="skeleton-profile-badge"></div>
          <div className="skeleton-profile-badge"></div>
          <div className="skeleton-profile-badge"></div>
        </div>
      </div>
    </div>
  );
} 