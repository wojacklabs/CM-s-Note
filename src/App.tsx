import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PrivacyTermPage from './pages/PrivacyTermPage';
import Header from './components/Header';
import { getAllProjects } from './services/irysService';
import { CacheService } from './services/cacheService';
import './App.css';

function App() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'analysis' | 'metaverse'>('notes');
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    loadProjects();
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = activeTab === 'analysis' 
        ? ['growth-timeline', 'social-network', 'ranking-correlation']
        : activeTab === 'metaverse'
        ? ['metaverse-view']
        : ['community', 'dapps', 'cms'];
      
      const scrollPosition = window.scrollY + 150; // Offset for header/nav
      
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  // Reset active section when tab changes
  useEffect(() => {
    const sections = activeTab === 'analysis' 
      ? ['growth-timeline', 'social-network', 'ranking-correlation']
      : activeTab === 'metaverse'
      ? ['metaverse-view']
      : ['community', 'dapps', 'cms'];
    setActiveSection(sections[0]);
  }, [activeTab]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await getAllProjects();
      setProjects(projectList);
      if (projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (newProject: string) => {
    if (newProject !== selectedProject) {
      const currentCacheSize = Object.keys(localStorage).filter(key => 
        key.startsWith('cm-notes-cache-')
      ).length;
      
      if (currentCacheSize > 3) {
        console.log('[App] Clearing old caches to manage memory...');
        CacheService.clearAllCaches();
      }
      
      setSelectedProject(newProject);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  return (
    <Router>
      <div className="app">
        <Header 
          projects={projects}
          selectedProject={selectedProject}
          onProjectChange={handleProjectChange}
          loading={loading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {/* Section nav - moved from HomePage to be at same level as Header */}
        {selectedProject && (
          <div className="section-tabs">
            <div className="section-tabs-inner">
              {activeTab === 'analysis' ? (
                <>
                  <button 
                    className={`section-tab ${activeSection === 'growth-timeline' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('growth-timeline')}
                  >
                    Cumulative
                  </button>
                  <button 
                    className={`section-tab ${activeSection === 'social-network' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('social-network')}
                  >
                    Network
                  </button>
                  <button 
                    className={`section-tab ${activeSection === 'ranking-correlation' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('ranking-correlation')}
                  >
                    Correlation
                  </button>
                </>
              ) : activeTab === 'metaverse' ? (
                <>
                  <button 
                    className={`section-tab ${activeSection === 'metaverse-view' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('metaverse-view')}
                  >
                    Exhibition Hall
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className={`section-tab ${activeSection === 'community' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('community')}
                  >
                    Community
                  </button>
                  <button 
                    className={`section-tab ${activeSection === 'dapps' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('dapps')}
                  >
                    dApps
                  </button>
                  <button 
                    className={`section-tab ${activeSection === 'cms' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('cms')}
                  >
                    CMs
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage selectedProject={selectedProject} />} />
            <Route path="/privacy-term" element={<PrivacyTermPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 