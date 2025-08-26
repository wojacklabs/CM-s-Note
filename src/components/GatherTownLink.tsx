import { useState } from 'react';
import './GatherTownLink.css';

interface GatherTownLinkProps {
  spaceUrl?: string;
}

export default function GatherTownLink({ spaceUrl = 'https://app.gather.town/app/YOUR_SPACE_ID' }: GatherTownLinkProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="gather-town-container">
      <div className="gather-header">
        <h2>🏛️ CM's Note Town Hall</h2>
        <p className="gather-subtitle">Powered by Gather Town</p>
      </div>

      <div className="gather-preview">
        <img 
          src="https://assets-global.website-files.com/5f33b62a21e6b80302e99db9/60d0e1e7e1faf72ded9fbab0_gather-town-screenshot.png" 
          alt="Gather Town Preview"
          className="preview-image"
        />
        <div className="preview-overlay">
          <div className="feature-grid">
            <div className="feature">
              <span className="feature-icon">💬</span>
              <h3>Proximity Chat</h3>
              <p>Talk to people near you</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🖼️</span>
              <h3>Interactive Objects</h3>
              <p>Share screens, whiteboards, and more</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🎮</span>
              <h3>Fun Activities</h3>
              <p>Play games and socialize</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🏢</span>
              <h3>Custom Spaces</h3>
              <p>Designed for our community</p>
            </div>
          </div>
        </div>
      </div>

      <div className="gather-actions">
        <a 
          href={spaceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="enter-button"
        >
          Enter Town Hall
          <span className="arrow">→</span>
        </a>
        
        <button 
          className="help-button"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
      </div>

      {showInstructions && (
        <div className="gather-instructions">
          <h3>How to Join:</h3>
          <ol>
            <li>Click "Enter Town Hall" above</li>
            <li>Create your avatar (first time only)</li>
            <li>Use arrow keys or WASD to move</li>
            <li>Walk near others to start video chat</li>
            <li>Press X near objects to interact</li>
          </ol>
          
          <div className="tips">
            <h4>Pro Tips:</h4>
            <ul>
              <li>🎤 Press Ctrl/Cmd+D to mute/unmute</li>
              <li>📹 Press Ctrl/Cmd+E to toggle video</li>
              <li>💭 Press G to open chat</li>
              <li>🗺️ Press M to see the map</li>
            </ul>
          </div>
        </div>
      )}

      <div className="gather-info">
        <p className="free-tier-info">
          <strong>Free for up to 25 concurrent users</strong>
        </p>
        <p className="description">
          Our Town Hall is hosted on Gather Town, a professional virtual space platform 
          used by companies like GitHub, Shopify, and Netflix for remote collaboration.
        </p>
      </div>
    </div>
  );
}
