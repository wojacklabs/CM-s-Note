import { Link, useLocation } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  projects: string[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
  loading: boolean;
}

function Header({ projects, selectedProject, onProjectChange, loading }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1 className="logo">CM's Notes</h1>
          <div className="project-selector">
            <label htmlFor="project-select">Project:</label>
            {loading ? (
              <span className="loading-text">Loading...</span>
            ) : (
              <select
                id="project-select"
                value={selectedProject}
                onChange={(e) => onProjectChange(e.target.value)}
                disabled={projects.length === 0}
              >
                {projects.length === 0 ? (
                  <option>No projects available</option>
                ) : (
                  projects.map(project => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>
        
        <nav className="header-nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/users" 
            className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}
          >
            Users & Notes
          </Link>
          <Link 
            to="/tweets" 
            className={`nav-link ${location.pathname === '/tweets' ? 'active' : ''}`}
          >
            Recent Tweets
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header; 