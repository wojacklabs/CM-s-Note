import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom'; // Added Link import

import { Note, User } from '../types';
import { queryNotesByProject, loadMultipleNoteContents, queryCMPermissions } from '../services/irysService';
import { CacheService } from '../services/cacheService';
import { ProfileImageCacheService } from '../services/profileImageCache';
import { formatLastUpdated } from '../utils/dateUtils';
import UserCard from '../components/UserCard';
import CMCard from '../components/CMCard';
import FilterBar from '../components/FilterBar';
import NoteModal from '../components/NoteModal';
import { UserCardSkeleton, CMCardSkeleton } from '../components/SkeletonCard';
import SocialGraph from '../components/SocialGraph';
import GrowthTimeline from '../components/GrowthTimeline';
import RankingCorrelation from '../components/RankingCorrelation';
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

interface DAppInfo {
  dappName: string;
  dappTwitterHandle: string;
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
  const [cmInfos, setCmInfos] = useState<CMInfo[]>([]);
  const [displayedCMs, setDisplayedCMs] = useState<CMInfo[]>([]);
  const [dappInfos, setDappInfos] = useState<DAppInfo[]>([]);
  const [displayedDApps, setDisplayedDApps] = useState<DAppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllCMs, setShowAllCMs] = useState(false);
  const [showAllDApps, setShowAllDApps] = useState(false);
  const [loadingNoteContents, setLoadingNoteContents] = useState(false);
  const [noteContentProgress, setNoteContentProgress] = useState({ loaded: 0, total: 0 });
  
  // Filter states
  const [selectedCM, setSelectedCM] = useState<string>('all');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [selectedIcon, setSelectedIcon] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('none');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Auto-refresh interval ref
  const intervalRef = useRef<number | null>(null);
  const contentLoadingRef = useRef<boolean>(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'analysis'>('notes');

  // Sync activeTab with Header via custom event
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail === 'notes' || e?.detail === 'analysis') {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('app:activeTab', handler as EventListener);
    return () => window.removeEventListener('app:activeTab', handler as EventListener);
  }, []);

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
    const dappMap = new Map<string, DAppInfo>();
    
    // 테스트용 CM 계정들 (CM으로서는 노출하지 않음)
    const testCMHandles = ['0xrahulk']; // 소문자로 저장
    
    // dApp 프리셋 (소문자로 저장)
    const dappPresets = ['playhirys'];
    
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
        
        // dApp 프리셋 체크
        if (dappPresets.includes(cleanHandle.toLowerCase())) {
          dappMap.set(cmName, {
            dappName: cmName,
            dappTwitterHandle: cleanHandle,
            noteCount: 0,
            recentUsers: [],
            recentNotes: []
          });
          console.log(`[CM Data] Added as dApp from permissions: ${cmName} -> ${cleanHandle}`);
        } else {
          cmMap.set(cmName, {
            cmName,
            cmTwitterHandle: cleanHandle,
            noteCount: 0,
            recentUsers: [],
            recentNotes: []
          });
          console.log(`[CM Data] Added CM from permissions: ${cmName} -> ${cleanHandle}`);
        }
      });
    }
    
    // 노트 데이터를 처리하여 기존 CM/dApp에 노트 추가 또는 새로운 CM/dApp 생성
    notesData.forEach(note => {
      const cmName = note.cmName;
             const cmTwitterHandle = note.cmTwitterHandle ? (note.cmTwitterHandle.startsWith('@') ? note.cmTwitterHandle.substring(1) : note.cmTwitterHandle).toLowerCase() : undefined;
      
      // 테스트용 CM인지 확인 (cmTwitterHandle 또는 cmName으로 확인)
      const cleanTwitterHandle = cmTwitterHandle ? 
        (cmTwitterHandle.startsWith('@') ? cmTwitterHandle.substring(1) : cmTwitterHandle).toLowerCase() : '';
      const cleanCMName = cmName ? cmName.toLowerCase() : '';
      
      const isTestCM = testCMHandles.includes(cleanTwitterHandle) || testCMHandles.includes(cleanCMName);
      
      if (isTestCM) {
        console.log(`[CM Data] Skipping note for test CM: ${cmName} (${cmTwitterHandle})`);
        return;
      }
      
      // dApp인지 확인
      const isDApp = dappPresets.includes(cleanTwitterHandle) || 
                     (dappMap.has(cmName));
      
      if (isDApp) {
        if (!dappMap.has(cmName)) {
          // 권한 맵에 없는 dApp이지만 노트가 있는 경우 (레거시 데이터)
          const cleanHandle = cmTwitterHandle;
          
          dappMap.set(cmName, {
            dappName: cmName,
            dappTwitterHandle: cleanHandle || '',
            noteCount: 0,
            recentUsers: [],
            recentNotes: []
          });
          
          console.log(`[CM Data] Added dApp from note data: ${cmName}`);
        }
        
        const dappInfo = dappMap.get(cmName)!;
        dappInfo.noteCount++;
        
        // Add note to recent notes
        dappInfo.recentNotes.push(note);
        
        // Twitter handle은 이미 권한에서 설정되었으므로 추가 업데이트 불필요
        // 하지만 권한에 없는 경우를 위해 fallback 제공
        if (!dappInfo.dappTwitterHandle && cmTwitterHandle) {
          const cleanHandle = cmTwitterHandle;
          dappInfo.dappTwitterHandle = cleanHandle;
          console.log(`[CM Data] Found Twitter handle from note for dApp ${cmName}: ${cleanHandle}`);
        }
        
        // Add user to recent users if not already present
        const existingUserIndex = dappInfo.recentUsers.findIndex(
          user => user.twitterHandle === ((note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase())
        );
        
        if (existingUserIndex === -1) {
          dappInfo.recentUsers.push({
            twitterHandle: (note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase(),
            timestamp: note.timestamp
          });
        } else {
          // Update timestamp if this note is more recent
          if (note.timestamp > dappInfo.recentUsers[existingUserIndex].timestamp) {
            dappInfo.recentUsers[existingUserIndex].timestamp = note.timestamp;
          }
        }
      } else {
        if (!cmMap.has(cmName)) {
          // 권한 맵에 없는 CM이지만 노트가 있는 경우 (레거시 데이터)
                   const cleanHandle = cmTwitterHandle;
          
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
           const cleanHandle = cmTwitterHandle;
           cmInfo.cmTwitterHandle = cleanHandle;
           console.log(`[CM Data] Found Twitter handle from note for ${cmName}: ${cleanHandle}`);
         }
        
        // Add user to recent users if not already present
        const existingUserIndex = cmInfo.recentUsers.findIndex(
                   user => user.twitterHandle === ((note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase())
        );
        
        if (existingUserIndex === -1) {
          cmInfo.recentUsers.push({
            twitterHandle: (note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase(),
            timestamp: note.timestamp
          });
        } else {
          // Update timestamp if this note is more recent
          if (note.timestamp > cmInfo.recentUsers[existingUserIndex].timestamp) {
            cmInfo.recentUsers[existingUserIndex].timestamp = note.timestamp;
          }
        }
      }
    });
    
    // Sort recent users by timestamp and limit to most recent
    // Sort recent notes by timestamp and limit to most recent
         // Merge CMs by twitter handle to ensure one CM per handle
     const handleToCM = new Map<string, CMInfo>();
     cmMap.forEach(cm => {
       const handle = cm.cmTwitterHandle ? cm.cmTwitterHandle.toLowerCase() : undefined;
       if (!handle) return;
       if (!handleToCM.has(handle)) {
         handleToCM.set(handle, { ...cm });
       } else {
         const existing = handleToCM.get(handle)!;
         existing.noteCount += cm.noteCount;
         existing.recentUsers = [...existing.recentUsers, ...cm.recentUsers];
         existing.recentNotes = [...existing.recentNotes, ...cm.recentNotes];
       }
     });

     const cmInfoList = Array.from((handleToCM.size > 0 ? handleToCM.values() : cmMap.values())).map(cmInfo => ({
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
    
    // Process dApps similarly
    const dappInfoList = Array.from(dappMap.values()).map(dappInfo => ({
      ...dappInfo,
      recentUsers: dappInfo.recentUsers
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10), // Keep top 10 most recent users
      recentNotes: dappInfo.recentNotes
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    }));
    
    // Sort dApps by note count
    dappInfoList.sort((a, b) => b.noteCount - a.noteCount);
    
    console.log(`[CM Data] Total dApps processed: ${dappInfoList.length}`);
    console.log(`[CM Data] dApps with notes: ${dappInfoList.filter(dapp => dapp.noteCount > 0).length}`);
    
    setCmInfos(cmInfoList);
    setDappInfos(dappInfoList);
    return { cmInfoList, dappInfoList }; // Return both lists
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
        const key = (note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase();
        if (!userMap.has(key)) {
                  userMap.set(key, {
          twitterHandle: key,
          displayName: key,
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
  const processNotesToUsers = useCallback((notesData: Note[], mergedCmInfos: CMInfo[]) => {
    // Create a reverse map: twitterHandle -> cmName using merged CM data
    const twitterHandleToCM = new Map<string, string>();
    
    // Use provided merged CM data
    mergedCmInfos.forEach(cmInfo => {
      if (cmInfo.cmTwitterHandle) {
        const cleanHandle = (cmInfo.cmTwitterHandle.startsWith('@') ? cmInfo.cmTwitterHandle.substring(1) : cmInfo.cmTwitterHandle).toLowerCase();
        twitterHandleToCM.set(cleanHandle, cmInfo.cmName);
      }
    });
    
    // Create a map from CM Twitter handle to latest CM name
    const cmHandleToLatestName = new Map<string, string>();
    mergedCmInfos.forEach(cmInfo => {
      if (cmInfo.cmTwitterHandle) {
        const cleanHandle = (cmInfo.cmTwitterHandle.startsWith('@') ? cmInfo.cmTwitterHandle.substring(1) : cmInfo.cmTwitterHandle).toLowerCase();
        cmHandleToLatestName.set(cleanHandle, cmInfo.cmName);
      }
    });
    
    // Enrich notes with latest CM names
    const enrichedNotes = notesData.map(note => {
      if (note.cmTwitterHandle) {
        const cleanHandle = (note.cmTwitterHandle.startsWith('@') ? note.cmTwitterHandle.substring(1) : note.cmTwitterHandle).toLowerCase();
        const latestCmName = cmHandleToLatestName.get(cleanHandle);
        if (latestCmName && latestCmName !== note.cmName) {
          console.log(`[processNotesToUsers] Updating CM name from "${note.cmName}" to "${latestCmName}" for handle @${cleanHandle}`);
          return { ...note, cmName: latestCmName };
        }
      }
      return note;
    });
    
    // Group notes by user
    const userMap = new Map<string, User>();
    
    enrichedNotes.forEach(note => {
      const key = (note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase();
      if (!userMap.has(key)) {
        // Check if this user is a CM
                 const normalizedHandle = (note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase();
         const isCM = twitterHandleToCM.has(normalizedHandle);
         const cmName = isCM ? twitterHandleToCM.get(normalizedHandle) : null;
        
        userMap.set(key, {
          twitterHandle: key,
          displayName: isCM && cmName ? cmName : key, // For CMs, use cmName; for users, just handle
          notes: []
        });
      }
      userMap.get(key)!.notes.push(note);
    });
    
    const userList = Array.from(userMap.values());
    setUsers(userList);
    
    setLastUpdated(new Date());
    
    // Preload profile images in background
    const twitterHandles = userList.map(user => user.twitterHandle);
    const cmHandles = Array.from(twitterHandleToCM.keys())
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
  }, [loadNoteContentsInBackground]);

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
      
      // Process CM data first to get merged CM info
      const { cmInfoList: mergedCmInfos } = processCMData(enrichedNotes, cmTwitterHandles);
      
      // Process notes to users with merged CM data
      processNotesToUsers(enrichedNotes, mergedCmInfos);
      
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
  }, [selectedProject, processCMData, processNotesToUsers]);

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
        const { cmInfoList: mergedCmInfos } = processCMData(cachedNotes, cmTwitterHandles);
        processNotesToUsers(cachedNotes, mergedCmInfos);
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
  }, [users, selectedCM, selectedUserType, selectedIcon, selectedSort, searchQuery, calculateBadgeCount, cmInfos]);

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

  // Apply display limit for dApps
  useEffect(() => {
    if (showAllDApps) {
      setDisplayedDApps(dappInfos);
    } else {
      setDisplayedDApps(dappInfos.slice(0, DEFAULT_CM_LIMIT));
    }
  }, [dappInfos, showAllDApps]);

  // Reset showAllUsers, showAllCMs, and showAllDApps when filters change
  useEffect(() => {
    setShowAllUsers(false);
    setShowAllCMs(false);
    setShowAllDApps(false);
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
      // Find the CM's Twitter handle for the selected CM name
      const selectedCmInfo = cmInfos.find(cm => cm.cmName === selectedCM);
      if (selectedCmInfo && selectedCmInfo.cmTwitterHandle) {
        const normalizedCmHandle = (selectedCmInfo.cmTwitterHandle.startsWith('@') ? 
          selectedCmInfo.cmTwitterHandle.substring(1) : selectedCmInfo.cmTwitterHandle).toLowerCase();
        
        filtered = filtered.filter(user => 
          user.notes.some(note => {
            // Match by Twitter handle if available
            if (note.cmTwitterHandle) {
              const normalizedNoteHandle = (note.cmTwitterHandle.startsWith('@') ? 
                note.cmTwitterHandle.substring(1) : note.cmTwitterHandle).toLowerCase();
              return normalizedNoteHandle === normalizedCmHandle;
            }
            // Fallback to name matching for legacy data
            return note.cmName === selectedCM;
          })
        );
      } else {
        // Fallback: filter by name if no handle found
        filtered = filtered.filter(user => 
          user.notes.some(note => note.cmName === selectedCM)
        );
      }
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

  const handleShowAllDApps = () => {
    setShowAllDApps(true);
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
    <>
    <div className="home-page">
      {/* Tab switcher moved to Header; synced via custom event */}

      

      {activeTab === 'analysis' && (
        <>
          <section id="growth-timeline" className="growth-timeline-section">
            <GrowthTimeline notes={notes} cmInfos={cmInfos} />
          </section>
{/* Social Graph Section */}
{notes.length > 0 && cmInfos.length > 0 && (
            <section id="social-network" className="social-graph-section">
              <SocialGraph notes={notes} cmInfos={cmInfos} />
            </section>
          )}
          <section id="ranking-correlation" className="ranking-correlation-section">
            <RankingCorrelation notes={notes} />
          </section>
          
          
        </>
      )}

      {activeTab === 'notes' && (
        <>
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

          {/* dApp Section */}
          {dappInfos.length > 0 && (
            <section id="dapps" className="cm-section">
              <h2 className="section-title">dApps</h2>
              <div className="cm-grid">
                {loading || !hasDataLoaded ? (
                  // Show skeleton during loading
                  Array.from({ length: 3 }).map((_, index) => (
                    <CMCardSkeleton key={`dapp-skeleton-${index}`} />
                  ))
                ) : displayedDApps.length > 0 ? (
                  displayedDApps.map(dappInfo => (
                    <CMCard
                      key={dappInfo.dappName}
                      cmInfo={{
                        cmName: dappInfo.dappName,
                        cmTwitterHandle: dappInfo.dappTwitterHandle,
                        noteCount: dappInfo.noteCount,
                        recentUsers: dappInfo.recentUsers,
                        recentNotes: dappInfo.recentNotes
                      }}
                      onNoteClick={setSelectedNote}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No dApps found</p>
                  </div>
                )}
              </div>

              {!showAllDApps && dappInfos.length > DEFAULT_CM_LIMIT && (
                <div className="show-all-container">
                  <button 
                    onClick={handleShowAllDApps}
                    className="show-all-button"
                  >
                    Show All ({dappInfos.length - DEFAULT_CM_LIMIT} more)
                  </button>
                </div>
              )}
            </section>
          )}

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
          </section>
        </>
      )}
      {/* Note Modal */}
      {selectedNote && <NoteModal note={selectedNote} onClose={() => setSelectedNote(null)} />}
      
      {/* Footer */}
      <footer className="home-footer">
        <a 
          href="https://chromewebstore.google.com/detail/cms-notes/gojmblhkimanjdmooganfebjmcoelmdm"
          target="_blank"
          rel="noopener noreferrer"
          className="chrome-extension-link"
        >
          Download Extension
        </a>
        <span className="footer-separator">•</span>
        <Link to="/privacy-term" className="privacy-policy-link">
          Privacy Policy & Terms
        </Link>
      </footer>
    </div>
    </>
  );
}

export default HomePage; 