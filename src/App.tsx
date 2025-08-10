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
  const [activeTab, setActiveTab] = useState<'notes' | 'analysis'>('notes');

  useEffect(() => {
    loadProjects();
  }, []);

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
                  <button className="section-tab" onClick={() => handleSectionClick('growth-timeline')}>
                    Cumulative Numbers
                  </button>
                  <button className="section-tab" onClick={() => handleSectionClick('social-network')}>
                    Social Network
                  </button>
                  <button className="section-tab" onClick={() => handleSectionClick('ranking-correlation')}>
                    InfoFi Correlation
                  </button>
                </>
              ) : (
                <>
                  <button className="section-tab" onClick={() => handleSectionClick('community')}>
                    Community
                  </button>
                  <button className="section-tab" onClick={() => handleSectionClick('cms')}>
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