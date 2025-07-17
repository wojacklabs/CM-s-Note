import { useState, useEffect } from 'react';
import Marquee from 'react-fast-marquee';
import { Note, Tweet } from '../types';
import { queryNotesByProject } from '../services/irysService';
import { getMultipleUsersTweets } from '../services/twitterService';
import TweetCard from '../components/TweetCard';
import './TweetsPage.css';

interface TweetsPageProps {
  selectedProject: string;
}

function TweetsPage({ selectedProject }: TweetsPageProps) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [speed, setSpeed] = useState(50);
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  useEffect(() => {
    if (selectedProject) {
      loadTweets();
    }
  }, [selectedProject]);

  const loadTweets = async () => {
    try {
      setLoading(true);
      
      // Get notes for the project
      const projectNotes = await queryNotesByProject(selectedProject);
      
      // Extract unique Twitter handles
      const uniqueHandles = Array.from(
        new Set(projectNotes.map(note => note.twitterHandle))
      );
      
      // Fetch tweets for all users
      const allTweets = await getMultipleUsersTweets(uniqueHandles);
      setTweets(allTweets);
    } catch (error) {
      console.error('Error loading tweets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tweets-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading tweets...</p>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="tweets-page">
        <div className="empty-state">
          <p>Please select a project to view tweets.</p>
        </div>
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="tweets-page">
        <div className="empty-state">
          <p>No tweets found for users in this project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tweets-page">
      <div className="page-header">
        <h2>Recent Tweets - {selectedProject}</h2>
        <p className="page-subtitle">
          Showing tweets from users with CM notes
        </p>
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="speed">Speed:</label>
          <input
            type="range"
            id="speed"
            min="20"
            max="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <span>{speed}</span>
        </div>
        
        <div className="control-group">
          <label htmlFor="direction">Direction:</label>
          <select
            id="direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'left' | 'right')}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div className="marquee-container">
        <Marquee
          speed={speed}
          direction={direction}
          gradient={true}
          gradientColor="#f9fafb"
          gradientWidth={100}
        >
          {tweets.map((tweet, index) => (
            <TweetCard key={`${tweet.id}-${index}`} tweet={tweet} />
          ))}
        </Marquee>
      </div>

      <div className="info-box">
        <p>
          <strong>Note:</strong> This is currently showing mock tweet data. 
          To display real tweets, you need to configure Twitter API authentication.
        </p>
      </div>
    </div>
  );
}

export default TweetsPage; 