import { useEffect, useRef } from 'react';
import { renderTwitterEmbeds } from '../services/twitterService';
import './EmbeddedTweet.css';

interface EmbeddedTweetProps {
  embedHTML: string;
  username: string;
}

function EmbeddedTweet({ embedHTML, username }: EmbeddedTweetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && embedHTML) {
      // Set the HTML content
      containerRef.current.innerHTML = embedHTML;
      
      // Render Twitter widgets if they're real Twitter embeds
      if (embedHTML.includes('twitter-tweet')) {
        renderTwitterEmbeds();
      }
    }
  }, [embedHTML]);

  return (
    <div className="embedded-tweet" ref={containerRef}>
      {/* Content will be inserted via innerHTML */}
    </div>
  );
}

export default EmbeddedTweet; 