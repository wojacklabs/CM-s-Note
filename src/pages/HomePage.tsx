import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Note, User } from '../types';
import { queryNotesByProject, loadMultipleNoteContents, queryCMPermissions } from '../services/irysService';
import { CacheService } from '../services/cacheService';
import { formatLastUpdated } from '../utils/dateUtils';
import UserCard from '../components/UserCard';
import CMCard from '../components/CMCard';
import FilterBar from '../components/FilterBar';
import NoteModal from '../components/NoteModal';
import UserProfileCard from '../components/UserProfileCard';
import Marquee from 'react-fast-marquee';
import './HomePage.css';

interface CMInfo {
  cmName: string;
  cmTwitterHandle?: string;
  noteCount: number;
  recentUsers: Array<{
    twitterHandle: string;
    timestamp: number;
  }>;
  recentNotes: Note[];
}

interface HomePageProps {
  selectedProject: string;
}

const DEFAULT_USER_LIMIT = 6;

function HomePage({ selectedProject }: HomePageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [cmInfos, setCmInfos] = useState<CMInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [loadingNoteContents, setLoadingNoteContents] = useState(false);
  const [noteContentProgress, setNoteContentProgress] = useState({ loaded: 0, total: 0 });
  
  // Filter states
  const [selectedCM, setSelectedCM] = useState<string>('all');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [selectedIcon, setSelectedIcon] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('none');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Marquee controls
  const [speed, setSpeed] = useState(50);
  
  // Auto-refresh interval ref
  const intervalRef = useRef<number | null>(null);
  const contentLoadingRef = useRef<boolean>(false);

  // Mark page refresh on component mount
  useEffect(() => {
    CacheService.markPageRefresh();
  }, []);

  // Calculate badge count for a user
  const calculateBadgeCount = useCallback((user: User) => {
    const notesByCM = new Map<string, Note[]>();
    
    user.notes.forEach(note => {
      const key = `${note.cmName}-${note.iconUrl}`;
      if (!notesByCM.has(key)) {
        notesByCM.set(key, []);
      }
      notesByCM.get(key)!.push(note);
    });
    
    return notesByCM.size;
  }, []);

  // Process CM data
  const processCMData = useCallback((notesData: Note[], cmTwitterHandlesMap?: Map<string, string>) => {
    const cmMap = new Map<string, CMInfo>();
    
    notesData.forEach(note => {
      const cmName = note.cmName;
      const cmTwitterHandle = note.cmTwitterHandle;
      
      if (!cmMap.has(cmName)) {
        // Use Twitter handle from permissions if available
        const permissionTwitterHandle = cmTwitterHandlesMap?.get(cmName);
        cmMap.set(cmName, {
          cmName,
          cmTwitterHandle: permissionTwitterHandle || cmTwitterHandle,
          noteCount: 0,
          recentUsers: [],
          recentNotes: []
        });
      }
      
      const cmInfo = cmMap.get(cmName)!;
      cmInfo.noteCount++;
      
      // Add note to recent notes
      cmInfo.recentNotes.push(note);
      
      // Update cmTwitterHandle - prioritize permission data
      const permissionTwitterHandle = cmTwitterHandlesMap?.get(cmName);
      if (permissionTwitterHandle) {
        cmInfo.cmTwitterHandle = permissionTwitterHandle;
        // Debug: Log when CM Twitter handle is found from permissions
        if (cmInfo.noteCount === 1) {
          console.log(`[CM Data] Found Twitter handle from permissions for ${cmName}: @${permissionTwitterHandle}`);
        }
      } else if (cmTwitterHandle) {
        cmInfo.cmTwitterHandle = cmTwitterHandle;
        // Debug: Log when CM Twitter handle is found from note
        if (cmInfo.noteCount === 1) {
          console.log(`[CM Data] Found Twitter handle from note for ${cmName}: @${cmTwitterHandle}`);
        }
      }
      
      // Add user to recent users if not already present
      const existingUserIndex = cmInfo.recentUsers.findIndex(
        user => user.twitterHandle === note.twitterHandle
      );
      
      if (existingUserIndex === -1) {
        cmInfo.recentUsers.push({
          twitterHandle: note.twitterHandle,
          timestamp: note.timestamp
        });
      } else {
        // Update timestamp if this note is more recent
        if (note.timestamp > cmInfo.recentUsers[existingUserIndex].timestamp) {
          cmInfo.recentUsers[existingUserIndex].timestamp = note.timestamp;
        }
      }
    });
    
    // Sort recent users by timestamp and limit to most recent
    // Sort recent notes by timestamp and limit to most recent
    const cmInfoList = Array.from(cmMap.values()).map(cmInfo => ({
      ...cmInfo,
      recentUsers: cmInfo.recentUsers
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10), // Keep top 10 most recent users
      recentNotes: cmInfo.recentNotes
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    }));
    
    // Sort CMs by note count (descending)
    cmInfoList.sort((a, b) => b.noteCount - a.noteCount);
    
    setCmInfos(cmInfoList);
  }, []);

  // Load note contents in background
  const loadNoteContentsInBackground = useCallback(async (notesData: Note[]) => {
    if (contentLoadingRef.current) return; // Already loading
    
    const notesWithoutContent = notesData.filter(note => !note.content);
    if (notesWithoutContent.length === 0) return;

    contentLoadingRef.current = true;
    setLoadingNoteContents(true);
    setNoteContentProgress({ loaded: 0, total: notesWithoutContent.length });

    try {
      console.log(`[HomePage] Starting background loading of ${notesWithoutContent.length} note contents`);
      
      // Use progress callback to update UI
      const updatedNotes = await loadMultipleNoteContents(notesData, (loaded, total) => {
        setNoteContentProgress({ loaded, total });
      });
      
      // Update notes state with loaded content
      setNotes(updatedNotes);
      
      // Update users with loaded content
      const userMap = new Map<string, User>();
      updatedNotes.forEach(note => {
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
      
      console.log(`[HomePage] Background loading completed for ${notesWithoutContent.length} note contents`);
      
    } catch (error) {
      console.error('Error loading note contents in background:', error);
    } finally {
      setLoadingNoteContents(false);
      setNoteContentProgress({ loaded: 0, total: 0 });
      contentLoadingRef.current = false;
    }
  }, []);

  // Process notes data to users
  const processNotesToUsers = useCallback((notesData: Note[], cmTwitterHandlesMap?: Map<string, string>) => {
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
    
    // Process CM data
    processCMData(notesData, cmTwitterHandlesMap);
    
    setLastUpdated(new Date());
    
    // Start background loading of note contents
    setTimeout(() => {
      loadNoteContentsInBackground(notesData);
    }, 100); // Small delay to ensure UI is rendered first
  }, [processCMData, loadNoteContentsInBackground]);

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
      
      // Load both notes and CM permissions in parallel
      const [projectNotes, cmTwitterHandles] = await Promise.all([
        queryNotesByProject(selectedProject),
        queryCMPermissions(selectedProject)
      ]);
      
      setNotes(projectNotes);
      processNotesToUsers(projectNotes, cmTwitterHandles);
      
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

  // Load data with caching strategy
  const loadData = useCallback(async () => {
    if (!selectedProject) return;
    
    const isPageRefresh = CacheService.shouldRefreshOnLoad();
    const cachedNotes = CacheService.getFromCache(selectedProject);
    
    // Always show cached data immediately if available
    if (cachedNotes && cachedNotes.length > 0) {
      console.log(`[HomePage] Loading from cache for project: ${selectedProject}`);
      setNotes(cachedNotes);
      
      // Load CM permissions even when using cached notes
      queryCMPermissions(selectedProject).then(cmTwitterHandles => {
        processNotesToUsers(cachedNotes, cmTwitterHandles);
      });
      
      setLoading(false);
      
      // If it's a page refresh, always fetch fresh data in background
      if (isPageRefresh) {
        console.log(`[HomePage] Page refresh detected, fetching fresh data...`);
        await loadDataFromAPI(false);
      } else if (!CacheService.isCacheValid(selectedProject)) {
        // If cache is invalid and not a page refresh, fetch fresh data
        console.log(`[HomePage] Cache invalid, fetching fresh data...`);
        await loadDataFromAPI(false);
      } else {
        // Cache is valid, just update the timestamp
        setLastUpdated(new Date());
      }
    } else {
      // No cached data, fetch from API with loading state
      console.log(`[HomePage] No cached data, fetching from API...`);
      await loadDataFromAPI(true);
    }
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

  // Apply filters and sorting
  useEffect(() => {
    applyFiltersAndSorting();
  }, [users, selectedCM, selectedUserType, selectedIcon, selectedSort, searchQuery, calculateBadgeCount]);

  // Apply display limit
  useEffect(() => {
    if (showAllUsers) {
      setDisplayedUsers(filteredUsers);
    } else {
      setDisplayedUsers(filteredUsers.slice(0, DEFAULT_USER_LIMIT));
    }
  }, [filteredUsers, showAllUsers]);

  // Reset showAllUsers when filters change
  useEffect(() => {
    setShowAllUsers(false);
  }, [selectedCM, selectedUserType, selectedIcon, selectedSort, searchQuery]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const applyFiltersAndSorting = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const handleMatch = user.twitterHandle.toLowerCase().includes(query);
        const nicknameMatch = user.notes.some(note => 
          note.nickname?.toLowerCase().includes(query)
        );
        const userMatch = user.notes.some(note => 
          note.user?.toLowerCase().includes(query)
        );
        return handleMatch || nicknameMatch || userMatch;
      });
    }

    // Apply other filters
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

    // Apply sorting
    if (selectedSort === 'badge-asc') {
      filtered.sort((a, b) => calculateBadgeCount(a) - calculateBadgeCount(b));
    } else if (selectedSort === 'badge-desc') {
      filtered.sort((a, b) => calculateBadgeCount(b) - calculateBadgeCount(a));
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

  const handleShowAllUsers = () => {
    setShowAllUsers(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
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
          {loadingNoteContents && (
            <span className="content-loading-indicator">
              <div className="small-spinner"></div>
              Loading note contents in background...
              {noteContentProgress.total > 0 && (
                <span className="progress-info">
                  ({noteContentProgress.loaded}/{noteContentProgress.total})
                </span>
              )}
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
          selectedSort={selectedSort}
          onCMChange={setSelectedCM}
          onUserTypeChange={setSelectedUserType}
          onIconChange={setSelectedIcon}
          onSortChange={setSelectedSort}
        />

        <div className="search-area">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search users by handle, nickname, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                onClick={handleClearSearch}
                className="clear-search-button"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="users-grid">
          {displayedUsers.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            displayedUsers.map(user => (
              <UserCard
                key={user.twitterHandle}
                user={user}
                onNoteClick={setSelectedNote}
              />
            ))
          )}
        </div>

        {!showAllUsers && filteredUsers.length > DEFAULT_USER_LIMIT && (
          <div className="show-all-container">
            <button 
              onClick={handleShowAllUsers}
              className="show-all-button"
            >
              Show All ({filteredUsers.length - DEFAULT_USER_LIMIT} more)
            </button>
          </div>
        )}

        {filteredUsers.length > 0 && (
          <div className="users-summary">
            <span className="users-count">
              Showing {displayedUsers.length} of {filteredUsers.length} users
            </span>
          </div>
        )}
      </section>

      {cmInfos.length > 0 && (
        <section className="cm-section">
          <h2 className="section-title">Community Managers</h2>
          <div className="cm-grid">
            {cmInfos.map(cmInfo => (
              <CMCard
                key={cmInfo.cmName}
                cmInfo={cmInfo}
                onNoteClick={setSelectedNote}
              />
            ))}
          </div>
        </section>
      )}

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