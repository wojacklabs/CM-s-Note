import { Link, useLocation } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  projects: string[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
  loading: boolean;
  activeTab?: 'notes' | 'analysis';
  onTabChange?: (tab: 'notes' | 'analysis') => void;
}

function Header({ selectedProject, activeTab = 'notes', onTabChange }: HeaderProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo-link">
            <h1 className="logo">
              <img src="/icon128.png" alt="CM's Notes Logo" className="logo-icon" />
              <span>CM's Notes</span>
            </h1>
          </Link>
        </div>
        
        {isHomePage && selectedProject && onTabChange && (
          <nav className="header-tabs">
            <button className={`nav-tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => { onTabChange('notes'); window.dispatchEvent(new CustomEvent('app:activeTab', { detail: 'notes' })); }}>Notes</button>
            <button className={`nav-tab ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => { onTabChange('analysis'); window.dispatchEvent(new CustomEvent('app:activeTab', { detail: 'analysis' })); }}>Analysis</button>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header; 