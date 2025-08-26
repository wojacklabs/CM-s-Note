import { useState, useEffect } from 'react';
import './WorkAdventureIntegration.css';

interface WorkAdventureIntegrationProps {
  mapUrl?: string;
}

// Default WorkAdventure map path - relative to public folder
const DEFAULT_MAP_PATH = '/workadventure-map/cmnotes-townhall.json';

export default function WorkAdventureIntegration({ 
  mapUrl 
}: WorkAdventureIntegrationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [roomUrl, setRoomUrl] = useState('');
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);

  // Available avatars
  const avatars = [
    { id: 1, name: 'Business', color: '#1976D2' },
    { id: 2, name: 'Casual', color: '#4CAF50' },
    { id: 3, name: 'Creative', color: '#E91E63' },
    { id: 4, name: 'Tech', color: '#FF9800' },
    { id: 5, name: 'Formal', color: '#9C27B0' },
    { id: 6, name: 'Student', color: '#00BCD4' }
  ];

  useEffect(() => {
    // Generate room URL with the map
    // Use the map path with current host
    const host = window.location.host; // This gets just "www.notesfromcm.xyz" without protocol
    const protocol = window.location.protocol; // This gets "https:"
    const path = mapUrl || DEFAULT_MAP_PATH;
    
    // Construct the full URL properly
    const fullMapUrl = `${protocol}//${host}${path}`;
    
    // WorkAdventure expects the full URL after /_/global/
    const workAdventureUrl = `https://play.workadventu.re/_/global/${host}${path}`;
    
    console.log('Map URL:', fullMapUrl);
    console.log('WorkAdventure URL:', workAdventureUrl);
    
    setRoomUrl(workAdventureUrl);
  }, [mapUrl]);

  const handleJoin = () => {
    if (playerName.trim()) {
      // Show character selection
      setShowCharacterSelect(true);
    }
  };

  const handleStartGame = () => {
    // Add player name and character to URL
    const urlWithParams = `${roomUrl}#${encodeURIComponent(playerName)}&character=${selectedAvatar}`;
    window.open(urlWithParams, '_blank');
    setShowCharacterSelect(false);
  };

  return (
    <div className="workadventure-integration">
      <div className="wa-main-content">
        <div className="wa-preview-section">
          <div className="wa-iframe-container">
            {isLoading && (
              <div className="wa-loading">
                <div className="wa-spinner"></div>
                <p>Loading virtual world...</p>
              </div>
            )}
            
            <iframe
              src={roomUrl}
              width="100%"
              height="100%"
              allow="camera; microphone; fullscreen"
              onLoad={() => setIsLoading(false)}
              title="WorkAdventure Virtual Office"
            />
          </div>

          <div className="wa-controls">
            <div className="wa-join-section">
              <input
                type="text"
                placeholder="Enter your name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    handleJoin();
                  }
                }}
                className="wa-name-input"
              />
              <button 
                onClick={handleJoin}
                disabled={!playerName.trim()}
                className="wa-join-button"
              >
                Select Character
              </button>
            </div>

            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="wa-help-button"
            >
              {showInstructions ? 'Hide' : 'Show'} Controls
            </button>
          </div>
        </div>

        {showInstructions && (
          <div className="wa-instructions">
            <h3>🎮 How to Use WorkAdventure</h3>
            
            <div className="wa-controls-grid">
              <div className="wa-control-item">
                <span className="wa-key">↑↓←→</span>
                <span>Move around</span>
              </div>
              <div className="wa-control-item">
                <span className="wa-key">WASD</span>
                <span>Alternative movement</span>
              </div>
              <div className="wa-control-item">
                <span className="wa-key">Shift</span>
                <span>Run faster</span>
              </div>
              <div className="wa-control-item">
                <span className="wa-key">Ctrl+M</span>
                <span>Mute/Unmute</span>
              </div>
              <div className="wa-control-item">
                <span className="wa-key">Ctrl+E</span>
                <span>Camera on/off</span>
              </div>
              <div className="wa-control-item">
                <span className="wa-key">Space</span>
                <span>Interact with objects</span>
              </div>
            </div>

            <div className="wa-features">
              <h4>Features:</h4>
              <ul>
                <li>🎥 Proximity video chat - Get close to talk!</li>
                <li>🔇 Private zones for focused work</li>
                <li>📺 Screen sharing areas</li>
                <li>🎯 Interactive objects and games</li>
                <li>🚪 Multiple rooms and areas</li>
                <li>💬 Text chat for everyone</li>
              </ul>
            </div>
          </div>
        )}

        {showCharacterSelect && (
          <div className="wa-character-modal">
            <div className="wa-character-content">
              <h2>Choose Your Character</h2>
              <p>Hello, {playerName}! Select your avatar:</p>
              
              <div className="wa-character-grid">
                {avatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`wa-character-option ${selectedAvatar === avatar.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(avatar.id)}
                  >
                    <div 
                      className="wa-character-preview"
                      style={{ backgroundColor: avatar.color }}
                    >
                      <div className="wa-character-icon">
                        {avatar.id}
                      </div>
                    </div>
                    <span>{avatar.name}</span>
                  </div>
                ))}
              </div>
              
              <div className="wa-character-actions">
                <button 
                  onClick={() => setShowCharacterSelect(false)}
                  className="wa-cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleStartGame}
                  className="wa-start-button"
                >
                  Enter Town Hall
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
