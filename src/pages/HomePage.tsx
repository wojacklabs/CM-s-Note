import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Note, User } from '../types';
import { queryNotesByProject, loadMultipleNoteContents, queryCMPermissions } from '../services/irysService';
import { CacheService } from '../services/cacheService';
import { ProfileImageCacheService } from '../services/profileImageCache';
import { formatLastUpdated } from '../utils/dateUtils';
import UserCard from '../components/UserCard';
import CMCard from '../components/CMCard';
import FilterBar from '../components/FilterBar';
import NoteModal from '../components/NoteModal';
import UserProfileCard from '../components/UserProfileCard';
import { UserCardSkeleton, CMCardSkeleton, UserProfileCardSkeleton } from '../components/SkeletonCard';
import SocialGraph from '../components/SocialGraph';
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
const DEFAULT_CM_LIMIT = 6;

function HomePage({ selectedProject }: HomePageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [cmInfos, setCmInfos] = useState<CMInfo[]>([]);
  const [displayedCMs, setDisplayedCMs] = useState<CMInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllCMs, setShowAllCMs] = useState(false);
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

  // Calculate badge count for a user (now simply counts total notes)
  const calculateBadgeCount = useCallback((user: User) => {
    return user.notes.length;
  }, []);

  // Process CM data
  const processCMData = useCallback((notesData: Note[], cmTwitterHandlesMap?: Map<string, string>) => {
    const cmMap = new Map<string, CMInfo>();
    
    // 테스트용 CM 계정들 (CM으로서는 노출하지 않음)
    const testCMHandles = ['0xrahulk']; // 소문자로 저장
    
    // 먼저 권한이 있는 모든 CM을 맵에 추가 (노트가 없어도 표시되도록)
    if (cmTwitterHandlesMap) {
      cmTwitterHandlesMap.forEach((twitterHandle, cmName) => {
        const cleanHandle = twitterHandle.startsWith('@') 
          ? twitterHandle.substring(1) 
          : twitterHandle;
        
        // 테스트용 CM 계정은 제외 (Twitter handle과 CM name 모두 확인)
        if (testCMHandles.includes(cleanHandle.toLowerCase()) || testCMHandles.includes(cmName.toLowerCase())) {
          console.log(`[CM Data] Skipping test CM account: ${cmName} -> ${cleanHandle}`);
          return;
        }
        
        cmMap.set(cmName, {
          cmName,
          cmTwitterHandle: cleanHandle,
          noteCount: 0,
          recentUsers: [],
          recentNotes: []
        });
        
        console.log(`[CM Data] Added CM from permissions: ${cmName} -> ${cleanHandle}`);
      });
    }
    
    // 노트 데이터를 처리하여 기존 CM에 노트 추가 또는 새로운 CM 생성
    notesData.forEach(note => {
      const cmName = note.cmName;
      const cmTwitterHandle = note.cmTwitterHandle;
      
      // 테스트용 CM인지 확인 (cmTwitterHandle 또는 cmName으로 확인)
      const cleanTwitterHandle = cmTwitterHandle ? 
        (cmTwitterHandle.startsWith('@') ? cmTwitterHandle.substring(1) : cmTwitterHandle).toLowerCase() : '';
      const cleanCMName = cmName ? cmName.toLowerCase() : '';
      
      const isTestCM = testCMHandles.includes(cleanTwitterHandle) || testCMHandles.includes(cleanCMName);
      
      if (isTestCM) {
        console.log(`[CM Data] Skipping note for test CM: ${cmName} (${cmTwitterHandle})`);
        return;
      }
      
      if (!cmMap.has(cmName)) {
        // 권한 맵에 없는 CM이지만 노트가 있는 경우 (레거시 데이터)
        const cleanHandle = cmTwitterHandle ? (cmTwitterHandle.startsWith('@') 
          ? cmTwitterHandle.substring(1) 
          : cmTwitterHandle) : undefined;
        
        // 테스트용 CM은 레거시 데이터에서도 제외 (Twitter handle과 CM name 모두 확인)
        if ((cleanHandle && testCMHandles.includes(cleanHandle.toLowerCase())) || 
            testCMHandles.includes(cmName.toLowerCase())) {
          console.log(`[CM Data] Skipping test CM from legacy data: ${cmName} -> ${cleanHandle}`);
          return;
        }
        
        cmMap.set(cmName, {
          cmName,
          cmTwitterHandle: cleanHandle,
          noteCount: 0,
          recentUsers: [],
          recentNotes: []
        });
        
        console.log(`[CM Data] Added CM from note data: ${cmName}`);
      }
      
      const cmInfo = cmMap.get(cmName)!;
      cmInfo.noteCount++;
      
      // Add note to recent notes
      cmInfo.recentNotes.push(note);
      
      // Twitter handle은 이미 권한에서 설정되었으므로 추가 업데이트 불필요
      // 하지만 권한에 없는 경우를 위해 fallback 제공
      if (!cmInfo.cmTwitterHandle && cmTwitterHandle) {
        const cleanHandle = cmTwitterHandle.startsWith('@') 
          ? cmTwitterHandle.substring(1) 
          : cmTwitterHandle;
        cmInfo.cmTwitterHandle = cleanHandle;
        console.log(`[CM Data] Found Twitter handle from note for ${cmName}: ${cleanHandle}`);
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
    
    // Sort CMs: 노트가 있는 CM을 먼저, 그 다음 노트 수 기준으로 정렬
    cmInfoList.sort((a, b) => {
      if (a.noteCount === 0 && b.noteCount === 0) {
        return a.cmName.localeCompare(b.cmName); // 둘 다 노트가 없으면 이름순
      }
      if (a.noteCount === 0) return 1; // a가 노트 없으면 뒤로
      if (b.noteCount === 0) return -1; // b가 노트 없으면 뒤로
      return b.noteCount - a.noteCount; // 노트 수 기준 내림차순
    });
    
    console.log(`[CM Data] Total CMs processed: ${cmInfoList.length}`);
    console.log(`[CM Data] CMs with notes: ${cmInfoList.filter(cm => cm.noteCount > 0).length}`);
    console.log(`[CM Data] CMs without notes: ${cmInfoList.filter(cm => cm.noteCount === 0).length}`);
    
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
    // Enrich notes with CM Twitter handles
    const enrichedNotes = notesData.map(note => {
      if (cmTwitterHandlesMap && cmTwitterHandlesMap.has(note.cmName)) {
        return {
          ...note,
          cmTwitterHandle: cmTwitterHandlesMap.get(note.cmName)
        };
      }
      return note;
    });
    
    // Group notes by user
    const userMap = new Map<string, User>();
    
    enrichedNotes.forEach(note => {
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
    processCMData(enrichedNotes, cmTwitterHandlesMap);
    
    setLastUpdated(new Date());
    
    // Preload profile images in background
    const twitterHandles = userList.map(user => user.twitterHandle);
    const cmHandles = Array.from(cmTwitterHandlesMap?.values() || [])
      .filter(handle => handle)
      .map(handle => handle.startsWith('@') ? handle.substring(1) : handle);
    
    const allHandles = [...new Set([...twitterHandles, ...cmHandles])];
    
    console.log(`[HomePage] Preloading ${allHandles.length} profile images in background`);
    ProfileImageCacheService.preloadAllImages(allHandles).then(() => {
      console.log(`[HomePage] Profile images preloading completed`);
    });
    
    // Start background loading of note contents
    setTimeout(() => {
      loadNoteContentsInBackground(enrichedNotes);
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
      
      // Enrich notes with CM Twitter handles
      const enrichedNotes = projectNotes.map(note => {
        if (cmTwitterHandles && cmTwitterHandles.has(note.cmName)) {
          return {
            ...note,
            cmTwitterHandle: cmTwitterHandles.get(note.cmName)
          };
        }
        return note;
      });
      
      setNotes(enrichedNotes);
      processNotesToUsers(enrichedNotes, cmTwitterHandles);
      setHasDataLoaded(true);
      
      // Save to cache
      CacheService.saveToCache(selectedProject, enrichedNotes);
      
      console.log(`[HomePage] Loaded ${enrichedNotes.length} notes from API`);
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't set hasDataLoaded to true on error, keep showing skeleton
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
      
      setHasDataLoaded(true);
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
      setHasDataLoaded(false);
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

  // Apply display limit for users
  useEffect(() => {
    if (showAllUsers) {
      setDisplayedUsers(filteredUsers);
    } else {
      setDisplayedUsers(filteredUsers.slice(0, DEFAULT_USER_LIMIT));
    }
  }, [filteredUsers, showAllUsers]);

  // Apply display limit for CMs
  useEffect(() => {
    if (showAllCMs) {
      setDisplayedCMs(cmInfos);
    } else {
      setDisplayedCMs(cmInfos.slice(0, DEFAULT_CM_LIMIT));
    }
  }, [cmInfos, showAllCMs]);

  // Reset showAllUsers and showAllCMs when filters change
  useEffect(() => {
    setShowAllUsers(false);
    setShowAllCMs(false);
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

  const handleShowAllCMs = () => {
    setShowAllCMs(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Remove the global loading state - we'll handle loading per section

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

{(loading || !hasDataLoaded || recentUsers.length > 0) && (
        <section id="recent-users" className="recent-users-section">
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
              {loading || !hasDataLoaded ? (
                // Show skeleton during loading
                Array.from({ length: 6 }).map((_, index) => (
                  <UserProfileCardSkeleton key={`recent-user-skeleton-${index}`} />
                ))
              ) : (
                recentUsers.map((user, index) => (
                  <UserProfileCard key={`${user.twitterHandle}-${index}`} user={user} />
                ))
              )}
            </Marquee>
          </div>
        </section>
      )}
      
      {/* Social Graph Section */}
      {notes.length > 0 && cmInfos.length > 0 && (
        <section id="social-network" className="social-graph-section">
          <SocialGraph notes={notes} cmInfos={cmInfos} />
        </section>
      )}
      
      <section id="community" className="users-section">
        <h2 className="section-title">Community</h2>
        <div className="status-bar">
        <div className="status-info">
          <span className="data-count">
            {loading || !hasDataLoaded ? 'Loading...' : `${notes.length} notes loaded`}
          </span>
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
        <FilterBar
          cms={hasDataLoaded ? getUniqueValues('cmName') : []}
          userTypes={hasDataLoaded ? getUniqueValues('userType') : []}
          icons={hasDataLoaded ? notes.map(n => ({ url: n.iconUrl, name: n.iconUrl })).filter((v, i, a) => a.findIndex(t => t.url === v.url) === i) : []}
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
          {loading || !hasDataLoaded ? (
            // Show skeleton during loading
            Array.from({ length: 6 }).map((_, index) => (
              <UserCardSkeleton key={`user-skeleton-${index}`} />
            ))
          ) : displayedUsers.length === 0 ? (
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

      <section id="cms" className="cm-section">
        <h2 className="section-title">CMs</h2>
        <div className="cm-grid">
          {loading || !hasDataLoaded ? (
            // Show skeleton during loading
            Array.from({ length: 3 }).map((_, index) => (
              <CMCardSkeleton key={`cm-skeleton-${index}`} />
            ))
          ) : displayedCMs.length > 0 ? (
            displayedCMs.map(cmInfo => (
              <CMCard
                key={cmInfo.cmName}
                cmInfo={cmInfo}
                onNoteClick={setSelectedNote}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>No CMs found</p>
            </div>
          )}
        </div>
        
        {!showAllCMs && cmInfos.length > DEFAULT_CM_LIMIT && (
          <div className="show-all-container">
            <button 
              onClick={handleShowAllCMs}
              className="show-all-button"
            >
              Show All ({cmInfos.length - DEFAULT_CM_LIMIT} more)
            </button>
          </div>
        )}
        
        {cmInfos.length > 0 && (
          <div className="cms-summary">
            <span className="cms-count">
              Showing {displayedCMs.length} of {cmInfos.length} CMs
            </span>
          </div>
        )}
      </section>
      <footer className="home-footer">
        <Link to="/privacy-term" className="privacy-policy-link">
          Privacy Policy
        </Link>
        <span className="footer-separator">|</span>
        <a 
          href="https://chromewebstore.google.com/detail/cms-notes/gojmblhkimanjdmooganfebjmcoelmdm"
          target="_blank"
          rel="noopener noreferrer"
          className="chrome-extension-link"
        >
          Chrome Extension
        </a>
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