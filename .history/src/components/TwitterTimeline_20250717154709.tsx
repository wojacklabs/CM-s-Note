import { useEffect, useRef } from 'react';
import './TwitterTimeline.css';

interface TwitterTimelineProps {
  username: string;
  height?: number;
  theme?: 'light' | 'dark';
}

// Twitter widget script loader
declare global {
  interface Window {
    twttr: any;
  }
}

function TwitterTimeline({ username, height = 600, theme = 'light' }: TwitterTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Twitter widgets script if not already loaded
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        if (window.twttr && containerRef.current) {
          createTimeline();
        }
      };
      document.body.appendChild(script);
    } else if (window.twttr.widgets) {
      createTimeline();
    }

    function createTimeline() {
      if (containerRef.current) {
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        // Create timeline
        window.twttr.widgets.createTimeline(
          {
            sourceType: 'profile',
            screenName: username
          },
          containerRef.current,
          {
            height: height,
            theme: theme,
            chrome: 'nofooter noborders',
            tweetLimit: 5
          }
        );
      }
    }
  }, [username, height, theme]);

  return (
    <div className="twitter-timeline-container" ref={containerRef}>
      <div className="timeline-loading">
        Loading tweets from @{username}...
      </div>
    </div>
  );
}

export default TwitterTimeline; 