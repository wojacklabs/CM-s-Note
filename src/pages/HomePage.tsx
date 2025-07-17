import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Note, User } from '../types';
import { queryNotesByProject } from '../services/irysService';
import { CacheService } from '../services/cacheService';
import { formatLastUpdated } from '../utils/dateUtils';
import UserCard from '../components/UserCard';
import FilterBar from '../components/FilterBar';
import NoteModal from '../components/NoteModal';
import UserProfileCard from '../components/UserProfileCard';
import Marquee from 'react-fast-marquee';
import './HomePage.css';

interface HomePageProps {
  selectedProject: string;
}

function HomePage({ selectedProject }: HomePageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Filter states
  const [selectedCM, setSelectedCM] = useState<string>('all');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [selectedIcon, setSelectedIcon] = useState<string>('all');
  
  // Marquee controls
  const [speed, setSpeed] = useState(50);
  
  // Auto-refresh interval ref
  const intervalRef = useRef<number | null>(null);

  // Process notes data to users
  const processNotesToUsers = useCallback((notesData: Note[]) => {
    // Group notes by user
    const userMap = new Map<string, User>();
    
    notesData.forEach(note => {
      const key = note.twitterHandle;
      if (!userMap.has(key)) {
        userMap.set(key, {
          twitterHandle: note.twitterHandle,
          displayName: note.twitterHandle,
          notes: []
        });
      }
      userMap.get(key)!.notes.push(note);
    });
    
    const userList = Array.from(userMap.values());
    setUsers(userList);
    
    // Get recent users (sorted by most recent note timestamp)
    const recentUserList = userList
      .map(user => ({
        ...user,
        latestNoteTimestamp: Math.max(...user.notes.map(note => note.timestamp || 0))
      }))
      .sort((a, b) => b.latestNoteTimestamp - a.latestNoteTimestamp)
      .slice(0, 20);
    
    setRecentUsers(recentUserList);
    setLastUpdated(new Date());
  }, []);

  // Load data from API
  const loadDataFromAPI = useCallback(async (showLoader = true) => {
    if (!selectedProject) return;
    
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setUpdating(true);
      }
      
      console.log(`[HomePage] Loading data from API for project: ${selectedProject}`);
      const projectNotes = await queryNotesByProject(selectedProject);
      
      setNotes(projectNotes);
      processNotesToUsers(projectNotes);
      
      // Save to cache
      CacheService.saveToCache(selectedProject, projectNotes);
      
      console.log(`[HomePage] Loaded ${projectNotes.length} notes from API`);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setUpdating(false);
      }
    }
  }, [selectedProject, processNotesToUsers]);

  // Load data (cache first, then API if needed)
  const loadData = useCallback(async () => {
    if (!selectedProject) return;
    
    // Try to load from cache first
    const cachedNotes = CacheService.getFromCache(selectedProject);
    
    if (cachedNotes && cachedNotes.length > 0) {
      console.log(`[HomePage] Loading from cache for project: ${selectedProject}`);
      setNotes(cachedNotes);
      processNotesToUsers(cachedNotes);
      setLoading(false);
      
      // If cache is still valid, don't fetch from API
      if (CacheService.isCacheValid(selectedProject)) {
        console.log(`[HomePage] Cache is valid, skipping API call`);
        setLastUpdated(new Date());
        return;
      }
    }
    
    // If no cache or cache is invalid, load from API
    await loadDataFromAPI(!cachedNotes || cachedNotes.length === 0);
  }, [selectedProject, processNotesToUsers, loadDataFromAPI]);

  // Setup auto-refresh
  const setupAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (selectedProject && !CacheService.isCacheValid(selectedProject)) {
        console.log('[HomePage] Auto-refreshing data...');
        loadDataFromAPI(false);
      }
    }, 60000) as unknown as number; // Check every minute
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedProject, loadDataFromAPI]);

  // Load data when project changes
  useEffect(() => {
    if (selectedProject) {
      loadData();
    }
  }, [selectedProject, loadData]);

  // Setup auto-refresh when component mounts or project changes
  useEffect(() => {
    const cleanup = setupAutoRefresh();
    return cleanup;
  }, [setupAutoRefresh]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [users, selectedCM, selectedUserType, selectedIcon]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const applyFilters = () => {
    let filtered = [...users];

    if (selectedCM !== 'all') {
      filtered = filtered.filter(user => 
        user.notes.some(note => note.cmName === selectedCM)
      );
    }

    if (selectedUserType !== 'all') {
      filtered = filtered.filter(user => 
        user.notes.some(note => note.userType === selectedUserType)
      );
    }

    if (selectedIcon !== 'all') {
      filtered = filtered.filter(user => 
        user.notes.some(note => note.iconUrl === selectedIcon)
      );
    }

    setFilteredUsers(filtered);
  };

  const getUniqueValues = (key: keyof Note): string[] => {
    const values = new Set<string>();
    notes.forEach(note => {
      const value = note[key];
      if (value && typeof value === 'string') {
        values.add(value);
      }
    });
    return Array.from(values).sort();
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="home-page">
        <div className="empty-state">
          <p>Please select a project from above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="status-bar">
        <div className="status-info">
          <span className="data-count">{notes.length} notes loaded</span>
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {formatLastUpdated(lastUpdated)}
            </span>
          )}
          {updating && (
            <span className="updating-indicator">
              <div className="small-spinner"></div>
              Updating...
            </span>
          )}
        </div>
      </div>

      <section className="users-section">
        <FilterBar
          cms={getUniqueValues('cmName')}
          userTypes={getUniqueValues('userType')}
          icons={notes.map(n => ({ url: n.iconUrl, name: n.iconUrl })).filter((v, i, a) => a.findIndex(t => t.url === v.url) === i)}
          selectedCM={selectedCM}
          selectedUserType={selectedUserType}
          selectedIcon={selectedIcon}
          onCMChange={setSelectedCM}
          onUserTypeChange={setSelectedUserType}
          onIconChange={setSelectedIcon}
        />

        <div className="users-grid">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <UserCard
                key={user.twitterHandle}
                user={user}
                onNoteClick={setSelectedNote}
              />
            ))
          )}
        </div>
      </section>

      {recentUsers.length > 0 && (
        <section className="recent-users-section">
          <h2 className="section-title">Recently Noted Users</h2>
          <div className="marquee-controls">
            <label>
              Speed: 
              <input
                type="range"
                min="20"
                max="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
              <span>{speed}</span>
            </label>
          </div>
          
          <div className="marquee-container">
            <Marquee
              speed={speed}
              gradient={true}
              gradientColor="#faf8f3"
              gradientWidth={120}
            >
              {recentUsers.map((user, index) => (
                <UserProfileCard key={`${user.twitterHandle}-${index}`} user={user} />
              ))}
            </Marquee>
          </div>
        </section>
      )}

      <footer className="home-footer">
        <Link to="/privacy-term" className="privacy-policy-link">
          Privacy Policy
        </Link>
      </footer>

      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
}

export default HomePage; 