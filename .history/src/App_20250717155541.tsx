import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import Header from './components/Header';
import { getAllProjects } from './services/irysService';
import './App.css';

function App() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="app">
      <Header 
        projects={projects}
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        loading={loading}
      />
      <main className="main-content">
        <HomePage selectedProject={selectedProject} />
      </main>
    </div>
  );
}

export default App; 