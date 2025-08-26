import { useState } from 'react';
import './EmbeddedMetaverse.css';

type MetaverseProvider = 'topia' | 'framevr' | 'hubs' | 'workadventure';

interface EmbeddedMetaverseProps {
  provider?: MetaverseProvider;
  roomUrl?: string;
}

const METAVERSE_CONFIGS = {
  topia: {
    name: 'Topia',
    description: '2D pixel art world with video chat',
    embedUrl: 'https://topia.io/YOUR_WORLD_ID?embed=true',
    features: ['Video chat', 'Screen share', 'Interactive objects', 'Custom worlds'],
    setup: 'Create world at topia.io and get embed URL'
  },
  framevr: {
    name: 'Frame VR',
    description: '3D virtual spaces in browser',
    embedUrl: 'https://framevr.io/YOUR_FRAME_ID',
    features: ['3D environments', 'VR support', 'No download', 'Custom avatars'],
    setup: 'Build space at framevr.io'
  },
  hubs: {
    name: 'Mozilla Hubs',
    description: 'Open source 3D virtual rooms',
    embedUrl: 'https://hubs.mozilla.com/YOUR_ROOM_ID',
    features: ['WebXR support', 'No account needed', 'Screen share', 'Open source'],
    setup: 'Create room at hubs.mozilla.com'
  },
  workadventure: {
    name: 'WorkAdventure',
    description: 'Open source 2D virtual world',
    embedUrl: 'https://play.workadventu.re/_/global/YOUR_MAP_URL',
    features: ['Self-hostable', 'Jitsi integration', 'Custom maps', 'Free & open'],
    setup: 'Host your own or use public instance'
  }
};

export default function EmbeddedMetaverse({ 
  provider = 'topia',
  roomUrl 
}: EmbeddedMetaverseProps) {
  const [selectedProvider, setSelectedProvider] = useState<MetaverseProvider>(provider);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(!roomUrl);

  const config = METAVERSE_CONFIGS[selectedProvider];
  const embedUrl = roomUrl || config.embedUrl;

  const handleProviderChange = (newProvider: MetaverseProvider) => {
    setSelectedProvider(newProvider);
    setIsLoading(true);
  };

  const sampleEmbedUrls = {
    topia: 'https://topia.io/cmnotes-townhall?embed=true',
    framevr: 'https://framevr.io/cmnotes-hall',
    hubs: 'https://hubs.mozilla.com/scenes/gWTBKfV',
    workadventure: 'https://play.workadventu.re/_/global/thecodingmachine.github.io/workadventure-map-starter-kit/map.json'
  };

  return (
    <div className="embedded-metaverse">
      <div className="metaverse-header">
        <h2>🌐 Virtual Town Hall</h2>
        <div className="provider-selector">
          {Object.entries(METAVERSE_CONFIGS).map(([key, value]) => (
            <button
              key={key}
              className={`provider-btn ${selectedProvider === key ? 'active' : ''}`}
              onClick={() => handleProviderChange(key as MetaverseProvider)}
            >
              {value.name}
            </button>
          ))}
        </div>
      </div>

      {showSetup ? (
        <div className="setup-guide">
          <h3>🚀 Set up {config.name}</h3>
          <p>{config.description}</p>
          
          <div className="features-grid">
            {config.features.map((feature, idx) => (
              <div key={idx} className="feature-item">
                <span className="check">✓</span>
                {feature}
              </div>
            ))}
          </div>

          <div className="setup-steps">
            <h4>Quick Setup:</h4>
            <ol>
              <li>{config.setup}</li>
              <li>Get your embed URL</li>
              <li>Update this component with your URL</li>
            </ol>
          </div>

          <div className="demo-section">
            <p>Want to see a demo?</p>
            <button 
              className="demo-btn"
              onClick={() => {
                setShowSetup(false);
                // Use sample URL for demo
                window.history.pushState({}, '', `?demo=${selectedProvider}`);
              }}
            >
              Load Demo Space
            </button>
          </div>

          <div className="code-example">
            <h4>Implementation:</h4>
            <pre>
{`<EmbeddedMetaverse 
  provider="${selectedProvider}"
  roomUrl="${sampleEmbedUrls[selectedProvider]}"
/>`}
            </pre>
          </div>
        </div>
      ) : (
        <div className="iframe-container">
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Loading {config.name}...</p>
            </div>
          )}
          
          <iframe
            src={embedUrl.includes('?demo=') ? sampleEmbedUrls[selectedProvider] : embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="camera; microphone; display-capture; xr-spatial-tracking"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            title={`${config.name} Virtual Space`}
          />

          <div className="iframe-controls">
            <button 
              className="back-btn"
              onClick={() => setShowSetup(true)}
            >
              ← Back to Setup
            </button>
            <a 
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="fullscreen-btn"
            >
              Open Fullscreen ↗
            </a>
          </div>
        </div>
      )}

      <div className="provider-info">
        <h3>Why {config.name}?</h3>
        <p>{config.description}</p>
        
        {selectedProvider === 'topia' && (
          <div className="provider-details">
            <h4>Topia Features:</h4>
            <ul>
              <li>🎨 Beautiful pixel art aesthetic</li>
              <li>🎥 Proximity-based video chat</li>
              <li>🖼️ Embed images, videos, and websites</li>
              <li>🎮 Built-in games and activities</li>
              <li>🔒 Private worlds with access control</li>
              <li>💰 Free tier available</li>
            </ul>
          </div>
        )}

        {selectedProvider === 'workadventure' && (
          <div className="provider-details">
            <h4>WorkAdventure Benefits:</h4>
            <ul>
              <li>🆓 100% free and open source</li>
              <li>🏠 Self-hostable for full control</li>
              <li>🗺️ Use Tiled editor for custom maps</li>
              <li>📹 Jitsi Meet integration</li>
              <li>🔧 Extensible with scripting</li>
              <li>🌍 Active community</li>
            </ul>
          </div>
        )}

        {selectedProvider === 'framevr' && (
          <div className="provider-details">
            <h4>Frame VR Advantages:</h4>
            <ul>
              <li>🎨 Beautiful 3D environments</li>
              <li>🥽 VR headset support</li>
              <li>🖱️ Easy drag-and-drop builder</li>
              <li>📱 Works on all devices</li>
              <li>🎬 Great for presentations</li>
              <li>🆓 Generous free tier</li>
            </ul>
          </div>
        )}

        {selectedProvider === 'hubs' && (
          <div className="provider-details">
            <h4>Mozilla Hubs Features:</h4>
            <ul>
              <li>🦊 By Mozilla (Firefox)</li>
              <li>🔓 No account required</li>
              <li>🥽 Best VR support</li>
              <li>📤 Easy 3D model upload</li>
              <li>🛠️ Highly customizable</li>
              <li>🌐 Privacy-focused</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
