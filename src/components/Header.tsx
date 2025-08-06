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
  const isHomePage = location.pathname === '/';

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo-link">
            <h1 className="logo">
              <img src="/icon128.png" alt="CM's Notes Logo" className="logo-icon" />
              CM's Notes
            </h1>
          </Link>
        </div>
        
        {isHomePage && selectedProject && (
          <nav className="section-nav">
            <button 
              className="section-link" 
              onClick={() => handleSectionClick('recent-users')}
            >
              Recent Users
            </button>
            <button 
              className="section-link" 
              onClick={() => handleSectionClick('social-network')}
            >
              Social Network
            </button>
            <button 
              className="section-link" 
              onClick={() => handleSectionClick('community')}
            >
              Community
            </button>
            <button 
              className="section-link" 
              onClick={() => handleSectionClick('cms')}
            >
              CMs
            </button>
          </nav>
        )}
        
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
    </header>
  );
}

export default Header; 