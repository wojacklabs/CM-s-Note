import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to CM's Notes Web</h1>
        <p className="hero-subtitle">
          Browse and curate notes from Community Managers across different projects
        </p>
      </div>

      <div className="features-grid">
        <Link to="/users" className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>Users & Notes</h3>
          <p>
            View users by CM, user type, and icon badges. Click on badges to see detailed notes.
          </p>
        </Link>

        <Link to="/tweets" className="feature-card">
          <div className="feature-icon">🐦</div>
          <h3>Recent Tweets</h3>
          <p>
            See recent tweets from users with CM notes in a flowing marquee display.
          </p>
        </Link>
      </div>

      <div className="info-section">
        <h2>How it works</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-number">1</span>
            <h4>Select a Project</h4>
            <p>Choose a project from the dropdown in the header to view its notes.</p>
          </div>
          <div className="info-item">
            <span className="info-number">2</span>
            <h4>Browse Users</h4>
            <p>Filter users by CM, user type, or icon badges to find specific profiles.</p>
          </div>
          <div className="info-item">
            <span className="info-number">3</span>
            <h4>View Notes</h4>
            <p>Click on user badges to read detailed notes written by Community Managers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage; 