import { useEffect, useRef } from 'react';
import './TwitterTimeline.css';

interface TwitterListTimelineProps {
  ownerUsername: string;
  listSlug: string;
  height?: number;
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    twttr: any;
  }
}

function TwitterListTimeline({ 
  ownerUsername, 
  listSlug, 
  height = 600, 
  theme = 'light' 
}: TwitterListTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        containerRef.current.innerHTML = '';
        
        // Create list timeline
        window.twttr.widgets.createTimeline(
          {
            sourceType: 'list',
            ownerScreenName: ownerUsername,
            slug: listSlug
          },
          containerRef.current,
          {
            height: height,
            theme: theme,
            chrome: 'nofooter noborders transparent',
            tweetLimit: 10
          }
        );
      }
    }
  }, [ownerUsername, listSlug, height, theme]);

  return (
    <div className="twitter-timeline-container" ref={containerRef}>
      <div className="timeline-loading">
        Loading tweets from list...
      </div>
    </div>
  );
}

export default TwitterListTimeline; 