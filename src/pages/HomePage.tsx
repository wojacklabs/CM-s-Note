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
// import MetaverseView from '../components/MetaverseView';
// import GatherTownLink from '../components/GatherTownLink';
// import EmbeddedMetaverse from '../components/EmbeddedMetaverse';
import WorkAdventureIntegration from '../components/WorkAdventureIntegration';
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
  name: string;
  twitterHandle: string;
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
  const [dAppInfos, setDAppInfos] = useState<DAppInfo[]>([]);
  const [displayedDApps, setDisplayedDApps] = useState<DAppInfo[]>([]);
  const [cmNameToHandleMap, setCmNameToHandleMap] = useState<Map<string, string>>(new Map());
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
  const [activeTab, setActiveTab] = useState<'notes' | 'analysis' | 'metaverse'>('notes');

  // Sync activeTab with Header via custom event
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail === 'notes' || e?.detail === 'analysis' || e?.detail === 'metaverse') {
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
  const processCMData = useCallback((notesData: Note[], cmTwitterHandlesMap?: Map<string, string>, handleToLatestName?: Map<string, string>) => {
    const cmMap = new Map<string, CMInfo>();
    const dAppMap = new Map<string, DAppInfo>();
    
    // CM name to Twitter handle mapping for tracking name changes
    const cmNameToHandleMap = new Map<string, string>();
    
    // 테스트용 CM 계정들 (CM으로서는 노출하지 않음)
    const testCMHandles = ['0xrahulk']; // 소문자로 저장
    
    // dApp로 분류할 트위터 핸들들
    const dAppHandles = ['playhirys', 'irysdune']; // 소문자로 저장, @ 없이, 정확한 철자
    console.log(`[dApp Data] dApp handles configured:`, dAppHandles);
    
    // 먼저 권한이 있는 모든 CM을 맵에 추가 (노트가 없어도 표시되도록)
    if (cmTwitterHandlesMap) {
      console.log(`[CM Data] CM permissions map size: ${cmTwitterHandlesMap.size}`);
      // Log first 10 entries
      let count = 0;
      cmTwitterHandlesMap.forEach((handle, name) => {
        if (count < 10) {
          console.log(`[CM Data] Permission entry: "${name}" -> @${handle}`);
          count++;
        }
      });
      cmTwitterHandlesMap.forEach((twitterHandle, cmName) => {
        const cleanHandle = twitterHandle.startsWith('@') 
          ? twitterHandle.substring(1) 
          : twitterHandle;
        
        // 테스트용 CM 계정은 제외 (Twitter handle과 CM name 모두 확인)
        if (testCMHandles.includes(cleanHandle.toLowerCase()) || testCMHandles.includes(cmName.toLowerCase())) {
          console.log(`[CM Data] Skipping test CM account: ${cmName} -> ${cleanHandle}`);
          return;
        }
        
        // dApp 계정은 제외
        if (dAppHandles.includes(cleanHandle.toLowerCase()) || dAppHandles.includes(cmName.toLowerCase())) {
          console.log(`[CM Data] Skipping dApp account from CM list: ${cmName} -> ${cleanHandle}`);
          return;
        }
        
        cmMap.set(cmName, {
          cmName,
          cmTwitterHandle: cleanHandle,
          noteCount: 0,
          recentUsers: [],
          recentNotes: []
        });
        
        // Track handle to name mapping
        cmNameToHandleMap.set(cmName, cleanHandle.toLowerCase());
        
        // Also add simplified versions of the name for better matching
        const simplifiedName = cmName
          .replace(/\s*\(.*?\)\s*/g, '') // Remove anything in parentheses
          .replace(/\s*\$.*$/g, '') // Remove $M or similar suffixes
          .trim();
        
        if (simplifiedName !== cmName) {
          cmNameToHandleMap.set(simplifiedName, cleanHandle.toLowerCase());
          console.log(`[CM Data] Also added simplified name: ${simplifiedName} -> ${cleanHandle}`);
        }
        
        // Also add version with special chars removed
        const baseName = simplifiedName
          .replace(/[^\w!]/g, '') // Keep only alphanumeric and !
          .toLowerCase();
        
        if (baseName !== simplifiedName.toLowerCase() && baseName !== cmName.toLowerCase()) {
          cmNameToHandleMap.set(baseName, cleanHandle.toLowerCase());
          cmNameToHandleMap.set(simplifiedName.toLowerCase(), cleanHandle.toLowerCase());
          console.log(`[CM Data] Also added base name variations: ${baseName}, ${simplifiedName.toLowerCase()} -> ${cleanHandle}`);
        }
        
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
      
      // dApp인지 확인
      console.log(`[CM Data] Checking if dApp - cmName: "${cmName}", cleanTwitterHandle: "${cleanTwitterHandle}", cleanCMName: "${cleanCMName}"`);
      const isDApp = dAppHandles.includes(cleanTwitterHandle) || dAppHandles.includes(cleanCMName);
      
      // Check if we have this CM name in our permissions map (for debugging missing CMs)
      if (!cmTwitterHandle && cmTwitterHandlesMap) {
        if (cmTwitterHandlesMap.has(cmName)) {
          console.log(`[CM Data] Found "${cmName}" in permissions map with handle: @${cmTwitterHandlesMap.get(cmName)}`);
        } else {
          console.log(`[CM Data] "${cmName}" NOT found in permissions map`);
          // Log similar names in permissions map for debugging
          let similarNames: string[] = [];
          for (const [permName, permHandle] of cmTwitterHandlesMap) {
            if (permName.toLowerCase().includes(cmName.toLowerCase()) || 
                cmName.toLowerCase().includes(permName.toLowerCase()) ||
                permName.toLowerCase().replace(/[^\w]/g, '') === cmName.toLowerCase().replace(/[^\w]/g, '')) {
              similarNames.push(`${permName} (@${permHandle})`);
            }
          }
          if (similarNames.length > 0) {
            console.log(`[CM Data] Similar names in permissions: ${similarNames.join(', ')}`);
          }
        }
      }
      
      if (isDApp) {
        console.log(`[dApp Data] Processing note from dApp: ${cmName} (${cleanTwitterHandle})`);
        // dApp으로 처리
        if (!dAppMap.has(cmName)) {
          dAppMap.set(cmName, {
            name: cmName,
            twitterHandle: cleanTwitterHandle || cleanCMName,
            noteCount: 0,
            recentUsers: [],
            recentNotes: []
          });
          console.log(`[dApp Data] Added dApp: ${cmName} -> ${cleanTwitterHandle || cleanCMName}`);
        }
        
        const dAppInfo = dAppMap.get(cmName)!;
        dAppInfo.noteCount++;
        dAppInfo.recentNotes.push(note);
        
        // Add user to recent users
        const existingUserIndex = dAppInfo.recentUsers.findIndex(
          user => user.twitterHandle === ((note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase())
        );
        
        if (existingUserIndex === -1) {
          dAppInfo.recentUsers.push({
            twitterHandle: (note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase(),
            timestamp: note.timestamp
          });
        } else {
          if (note.timestamp > dAppInfo.recentUsers[existingUserIndex].timestamp) {
            dAppInfo.recentUsers[existingUserIndex].timestamp = note.timestamp;
          }
        }
        
        return; // dApp 처리 완료
      }
      
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
    });
    
    // Sort recent users by timestamp and limit to most recent
    // Sort recent notes by timestamp and limit to most recent
             // First pass: Create handle-based map
    const handleToCM = new Map<string, CMInfo>();
    
    // Process notes to find all CM names that share the same Twitter handle
    const handleToNames = new Map<string, Set<string>>();
    notesData.forEach(note => {
      if (note.cmTwitterHandle) {
        const handle = note.cmTwitterHandle.toLowerCase();
        if (!handleToNames.has(handle)) {
          handleToNames.set(handle, new Set());
        }
        handleToNames.get(handle)!.add(note.cmName);
      }
    });
    
    // Log CM name variations
    handleToNames.forEach((names, handle) => {
      if (names.size > 1) {
        console.log(`[CM Data] Multiple names for @${handle}: ${Array.from(names).join(', ')}`);
      }
    });
    
    // Merge CMs by twitter handle to ensure one CM per handle
    cmMap.forEach(cm => {
      const handle = cm.cmTwitterHandle ? cm.cmTwitterHandle.toLowerCase() : undefined;
      if (!handle) {
        // For CMs without handles, try to find handle from notes
        const noteWithHandle = notesData.find(n => n.cmName === cm.cmName && n.cmTwitterHandle);
        if (noteWithHandle && noteWithHandle.cmTwitterHandle) {
          const foundHandle = noteWithHandle.cmTwitterHandle.toLowerCase();
          cm.cmTwitterHandle = foundHandle;
          console.log(`[CM Data] Found Twitter handle for "${cm.cmName}" from notes: @${foundHandle}`);
          
          if (!handleToCM.has(foundHandle)) {
            handleToCM.set(foundHandle, { ...cm });
          } else {
            const existing = handleToCM.get(foundHandle)!;
            existing.noteCount += cm.noteCount;
            existing.recentUsers = [...existing.recentUsers, ...cm.recentUsers];
            existing.recentNotes = [...existing.recentNotes, ...cm.recentNotes];
          }
        } else {
          // Try to match by base name (without emojis/special characters)
          const baseName = cm.cmName
            .replace(/\s*\(.*?\)\s*/g, '') // Remove anything in parentheses
            .replace(/\s*\$.*$/g, '') // Remove $M or similar suffixes
            .replace(/[^\w!]/g, '') // Keep only alphanumeric and !
            .trim()
            .toLowerCase();
          let foundHandle: string | undefined;
          
          // Check against cmTwitterHandlesMap from permissions
          if (cmTwitterHandlesMap) {
            for (const [permName, permHandle] of cmTwitterHandlesMap) {
              // Extract base name from permission CM name (remove emojis, special chars, etc)
              const permBaseName = permName
                .replace(/\s*\(.*?\)\s*/g, '') // Remove anything in parentheses
                .replace(/\s*\$.*$/g, '') // Remove $M or similar suffixes
                .replace(/[^\w!]/g, '') // Keep only alphanumeric and !
                .trim()
                .toLowerCase();
              
              // Also try matching with the original CM name for cases like "나옹 Meowth"
              const originalBaseName = cm.cmName
                .replace(/\s*\(.*?\)\s*/g, '')
                .replace(/\s*\$.*$/g, '')
                .trim()
                .toLowerCase();
              
              // Check if either the simplified name matches or if the permission name contains the CM name
              if (baseName === permBaseName || 
                  permBaseName.includes(baseName) || 
                  permName.toLowerCase().includes(originalBaseName) ||
                  // Special case for "나옹 Meowth" matching "meowth"
                  (originalBaseName === 'meowth' && permName.toLowerCase().includes('meowth'))) {
                
                foundHandle = permHandle.toLowerCase();
                if (foundHandle.startsWith('@')) {
                  foundHandle = foundHandle.substring(1);
                }
                console.log(`[CM Data] Matched CM "${cm.cmName}" to permission CM "${permName}" (@${foundHandle})`);
                // Add this mapping
                cmNameToHandleMap.set(cm.cmName, foundHandle);
                cm.cmTwitterHandle = foundHandle;
                break;
              }
            }
          }
          
          if (foundHandle) {
            if (!handleToCM.has(foundHandle)) {
              handleToCM.set(foundHandle, { ...cm });
            } else {
              const existing = handleToCM.get(foundHandle)!;
              existing.noteCount += cm.noteCount;
              existing.recentUsers = [...existing.recentUsers, ...cm.recentUsers];
              existing.recentNotes = [...existing.recentNotes, ...cm.recentNotes];
            }
          } else {
            console.warn(`[CM Data] CM "${cm.cmName}" has no Twitter handle and none found in notes or permissions`);
          }
        }
        return;
      }
      
      if (!handleToCM.has(handle)) {
        handleToCM.set(handle, { ...cm });
      } else {
        const existing = handleToCM.get(handle)!;
        console.log(`[CM Data] Merging duplicate CM entries for @${handle}: "${existing.cmName}" + "${cm.cmName}"`);
        
        // Always prefer the latest name from permissions for this handle
        let permissionCMName: string | undefined;
        if (handleToLatestName && handleToLatestName.has(handle)) {
          permissionCMName = handleToLatestName.get(handle);
        }
        
        if (permissionCMName) {
          existing.cmName = permissionCMName;
          console.log(`[CM Data] Using latest name from permissions for @${handle}: ${permissionCMName}`);
        } else {
          // If no permission data, use the most recent CM name based on note timestamps
          const existingLatestNote = existing.recentNotes.length > 0 
            ? Math.max(...existing.recentNotes.map(n => n.timestamp)) 
            : 0;
          const cmLatestNote = cm.recentNotes.length > 0 
            ? Math.max(...cm.recentNotes.map(n => n.timestamp)) 
            : 0;
          
          if (cmLatestNote > existingLatestNote) {
            existing.cmName = cm.cmName;
            console.log(`[CM Data] Using more recent name for @${handle}: ${cm.cmName} (timestamp: ${cmLatestNote})`);
          } else {
            console.log(`[CM Data] Keeping existing name for @${handle}: ${existing.cmName} (timestamp: ${existingLatestNote})`);
          }
        }
        
        existing.noteCount += cm.noteCount;
        existing.recentUsers = [...existing.recentUsers, ...cm.recentUsers];
        existing.recentNotes = [...existing.recentNotes, ...cm.recentNotes];
      }
    });
    
    // Second pass: Include all notes from previous CM names
    handleToNames.forEach((names, handle) => {
      if (handleToCM.has(handle)) {
        const cmInfo = handleToCM.get(handle)!;
        // Count all notes from all name variations
        let totalNotes = 0;
        const allUsers = new Map<string, { twitterHandle: string; timestamp: number }>();
        const allNotes: Note[] = [];
        
        names.forEach(name => {
          notesData.forEach(note => {
            if (note.cmName === name) {
              totalNotes++;
              allNotes.push(note);
              
              const userKey = (note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase();
              if (!allUsers.has(userKey) || note.timestamp > allUsers.get(userKey)!.timestamp) {
                allUsers.set(userKey, {
                  twitterHandle: userKey,
                  timestamp: note.timestamp
                });
              }
            }
          });
        });
        
        cmInfo.noteCount = totalNotes;
        cmInfo.recentUsers = Array.from(allUsers.values());
        cmInfo.recentNotes = allNotes;
        
        console.log(`[CM Data] CM @${handle} (${cmInfo.cmName}) total notes including all names: ${totalNotes}`);
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
    
    // Process dApp data
    const dAppInfoList = Array.from(dAppMap.values()).map(dAppInfo => ({
      ...dAppInfo,
      recentUsers: dAppInfo.recentUsers
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10),
      recentNotes: dAppInfo.recentNotes
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    }));
    
    // Sort dApps by note count
    dAppInfoList.sort((a, b) => b.noteCount - a.noteCount);
    
    console.log(`[dApp Data] Total dApps processed: ${dAppInfoList.length}`);
    console.log(`[dApp Data] dApp list:`, dAppInfoList.map(d => ({ name: d.name, handle: d.twitterHandle, noteCount: d.noteCount })));
    
    // Add CMs from note data to cmNameToHandleMap
    cmInfoList.forEach(cm => {
      if (cm.cmTwitterHandle && !cmNameToHandleMap.has(cm.cmName)) {
        cmNameToHandleMap.set(cm.cmName, cm.cmTwitterHandle.toLowerCase());
        console.log(`[CM Data] Added CM to name map from processed data: ${cm.cmName} -> ${cm.cmTwitterHandle}`);
        
        // Also add simplified versions
        const simplifiedName = cm.cmName
          .replace(/\s*\(.*?\)\s*/g, '') // Remove anything in parentheses
          .replace(/\s*\$.*$/g, '') // Remove $M or similar suffixes
          .trim();
        
        if (simplifiedName !== cm.cmName && !cmNameToHandleMap.has(simplifiedName)) {
          cmNameToHandleMap.set(simplifiedName, cm.cmTwitterHandle.toLowerCase());
          console.log(`[CM Data] Also added simplified name to map: ${simplifiedName} -> ${cm.cmTwitterHandle}`);
        }
        
        // Also add lowercase version
        if (simplifiedName.toLowerCase() !== simplifiedName && !cmNameToHandleMap.has(simplifiedName.toLowerCase())) {
          cmNameToHandleMap.set(simplifiedName.toLowerCase(), cm.cmTwitterHandle.toLowerCase());
        }
        
        // For names with Korean/multi-language, also add the English part
        const parts = simplifiedName.split(/\s+/);
        if (parts.length > 1) {
          // Try each part individually
          parts.forEach(part => {
            if (part && !cmNameToHandleMap.has(part) && cm.cmTwitterHandle) {
              cmNameToHandleMap.set(part, cm.cmTwitterHandle.toLowerCase());
              console.log(`[CM Data] Also added name part to map: ${part} -> ${cm.cmTwitterHandle}`);
            }
            if (part && part.toLowerCase() !== part && !cmNameToHandleMap.has(part.toLowerCase()) && cm.cmTwitterHandle) {
              cmNameToHandleMap.set(part.toLowerCase(), cm.cmTwitterHandle.toLowerCase());
            }
          });
        }
      }
    });
    
    // Also add CMs without Twitter handles but with consistent names from notes
    cmMap.forEach((cmInfo, cmName) => {
      if (!cmInfo.cmTwitterHandle && !cmNameToHandleMap.has(cmName)) {
        // Try to find handle from notes
        const noteWithHandle = notesData.find(note => 
          note.cmName === cmName && note.cmTwitterHandle
        );
        
        if (noteWithHandle && noteWithHandle.cmTwitterHandle) {
          cmNameToHandleMap.set(cmName, noteWithHandle.cmTwitterHandle.toLowerCase());
          console.log(`[CM Data] Found handle for ${cmName} from notes: ${noteWithHandle.cmTwitterHandle}`);
          
          // Add simplified versions
          const simplifiedName = cmName
            .replace(/\s*\(.*?\)\s*/g, '')
            .replace(/\s*\$.*$/g, '')
            .trim();
          
          if (simplifiedName !== cmName) {
            cmNameToHandleMap.set(simplifiedName, noteWithHandle.cmTwitterHandle.toLowerCase());
          }
          
          if (simplifiedName.toLowerCase() !== simplifiedName) {
            cmNameToHandleMap.set(simplifiedName.toLowerCase(), noteWithHandle.cmTwitterHandle.toLowerCase());
          }
          
          // For names with Korean/multi-language, also add the English part
          const parts = simplifiedName.split(/\s+/);
          if (parts.length > 1) {
            parts.forEach(part => {
              if (part && !cmNameToHandleMap.has(part) && noteWithHandle.cmTwitterHandle) {
                cmNameToHandleMap.set(part, noteWithHandle.cmTwitterHandle.toLowerCase());
              }
              if (part && part.toLowerCase() !== part && !cmNameToHandleMap.has(part.toLowerCase()) && noteWithHandle.cmTwitterHandle) {
                cmNameToHandleMap.set(part.toLowerCase(), noteWithHandle.cmTwitterHandle.toLowerCase());
              }
            });
          }
        }
      }
    });
    
    setCmInfos(cmInfoList);
    setDAppInfos(dAppInfoList);
    return { cmInfoList, dAppInfoList, cmNameToHandleMap }; // Return both lists and mapping
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
      
      // Update users with loaded content - need to exclude CMs and dApps
      // This is a simplified update since we don't have access to CM/dApp info here
      // The proper filtering is done in processNotesToUsers
      console.log(`[Background Content] Loaded content for ${updatedNotes.length} notes`);
      
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
  const processNotesToUsers = useCallback((notesData: Note[], mergedCmInfos: CMInfo[], dAppInfos: DAppInfo[]) => {
    // Create maps for quick lookup
    const cmHandleMap = new Map<string, CMInfo>(); // Twitter handle -> CM info
    const dAppHandleMap = new Map<string, DAppInfo>(); // Twitter handle -> dApp info
    
    // Build CM lookup map
    mergedCmInfos.forEach(cmInfo => {
      if (cmInfo.cmTwitterHandle) {
        const cleanHandle = cmInfo.cmTwitterHandle.toLowerCase();
        cmHandleMap.set(cleanHandle, cmInfo);
      }
    });
    
    // Build dApp lookup map
    dAppInfos.forEach(dAppInfo => {
      const cleanHandle = dAppInfo.twitterHandle.toLowerCase();
      dAppHandleMap.set(cleanHandle, dAppInfo);
    });
    
    // Group notes by user (INCLUDING CMs but excluding dApps)
    const userMap = new Map<string, User>();
    const cmAsUserHandles = new Set<string>(); // Track CMs that received notes
    const dAppAsUserHandles = new Set<string>(); // Track dApps that received notes
    
    notesData.forEach(note => {
      const userHandle = (note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase();
      
      // Check if this is a dApp - exclude from users
      if (dAppHandleMap.has(userHandle)) {
        dAppAsUserHandles.add(userHandle);
        console.log(`[Data Management] User @${userHandle} is a dApp (${dAppHandleMap.get(userHandle)!.name}), excluding from user list`);
        return; // Skip dApps from user list
      }
      
      // Check if this is a CM - include in users but with CM name as display name
      let displayName = userHandle;
      if (cmHandleMap.has(userHandle)) {
        cmAsUserHandles.add(userHandle);
        displayName = cmHandleMap.get(userHandle)!.cmName;
        console.log(`[Data Management] User @${userHandle} is a CM (${displayName}), including in user list with CM name`);
      }
      
      // Add to user map
      if (!userMap.has(userHandle)) {
        userMap.set(userHandle, {
          twitterHandle: userHandle,
          displayName: displayName,
          notes: []
        });
      }
      userMap.get(userHandle)!.notes.push(note);
    });
    
    const userList = Array.from(userMap.values());
    
    // Debug logging
    console.log('=== Data Management Debug ===');
    console.log(`Total notes processed: ${notesData.length}`);
    console.log(`Total CMs: ${mergedCmInfos.length}`);
    console.log(`Total dApps: ${dAppInfos.length}`);
    console.log(`Total users (excluding CMs/dApps): ${userList.length}`);
    console.log(`CMs that received notes: ${cmAsUserHandles.size}`);
    console.log(`dApps that received notes: ${dAppAsUserHandles.size}`);
    
    // Log CM details
    console.log('\n--- CM Details ---');
    mergedCmInfos.forEach(cm => {
      console.log(`CM: ${cm.cmName} (@${cm.cmTwitterHandle}) - ${cm.noteCount} notes`);
    });
    
    // Log dApp details
    if (dAppInfos.length > 0) {
      console.log('\n--- dApp Details ---');
      dAppInfos.forEach(dApp => {
        console.log(`dApp: ${dApp.name} (@${dApp.twitterHandle}) - ${dApp.noteCount} notes`);
      });
    }
    
    // Log top users
    console.log('\n--- Top 5 Users ---');
    userList
      .sort((a, b) => b.notes.length - a.notes.length)
      .slice(0, 5)
      .forEach(user => {
        console.log(`User: @${user.twitterHandle} - ${user.notes.length} notes`);
      });
    
    console.log('=== End Debug ===\n');
    
    // Comprehensive data debug function
    const debugAllData = () => {
      console.log('\n========== COMPREHENSIVE DATA DEBUG ==========');
      
      // All CMs
      console.log('\n--- ALL CMs ---');
      console.log(`Total CMs: ${mergedCmInfos.length}`);
      mergedCmInfos.forEach(cm => {
        console.log(`  CM: ${cm.cmName}`);
        console.log(`    Twitter: @${cm.cmTwitterHandle || 'N/A'}`);
        console.log(`    Notes written: ${cm.noteCount}`);
        console.log(`    Recent users: ${cm.recentUsers.map(u => '@' + u.twitterHandle).join(', ')}`);
      });
      
      // All dApps
      console.log('\n--- ALL dApps ---');
      console.log(`Total dApps: ${dAppInfos.length}`);
      dAppInfos.forEach(dApp => {
        console.log(`  dApp: ${dApp.name}`);
        console.log(`    Twitter: @${dApp.twitterHandle}`);
        console.log(`    Notes written: ${dApp.noteCount}`);
      });
      
      // All Users
      console.log('\n--- ALL USERS ---');
      console.log(`Total users: ${userList.length}`);
      const sortedUsers = [...userList].sort((a, b) => b.notes.length - a.notes.length);
      sortedUsers.forEach(user => {
        const isCM = cmHandleMap.has(user.twitterHandle);
        console.log(`  User: @${user.twitterHandle}${isCM ? ' (CM)' : ''}`);
        console.log(`    Display name: ${user.displayName}`);
        console.log(`    Notes received: ${user.notes.length}`);
        console.log(`    From CMs: ${[...new Set(user.notes.map(n => n.cmName))].join(', ')}`);
      });
      
      // All Notes Summary
      console.log('\n--- NOTES SUMMARY ---');
      console.log(`Total notes: ${notesData.length}`);
      const notesByCM = new Map<string, number>();
      const notesByUser = new Map<string, number>();
      notesData.forEach(note => {
        notesByCM.set(note.cmName, (notesByCM.get(note.cmName) || 0) + 1);
        const userHandle = (note.twitterHandle.startsWith('@') ? note.twitterHandle.substring(1) : note.twitterHandle).toLowerCase();
        notesByUser.set(userHandle, (notesByUser.get(userHandle) || 0) + 1);
      });
      
      console.log('\n  Top 10 CMs by notes:');
      Array.from(notesByCM.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([cm, count]) => {
          console.log(`    ${cm}: ${count} notes`);
        });
      
      console.log('\n  Top 10 Users by notes received:');
      Array.from(notesByUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([user, count]) => {
          const displayName = userMap.get(user)?.displayName || user;
          console.log(`    @${user} (${displayName}): ${count} notes`);
        });
      
      // Data integrity checks
      console.log('\n--- DATA INTEGRITY ---');
      const cmNamesInNotes = new Set(notesData.map(n => n.cmName));
      const cmNamesInCMList = new Set(mergedCmInfos.map(cm => cm.cmName));
      const missingCMs = Array.from(cmNamesInNotes).filter(name => !cmNamesInCMList.has(name) && !dAppInfos.some(d => d.name === name));
      if (missingCMs.length > 0) {
        console.warn(`  ⚠️  CMs in notes but not in CM list: ${missingCMs.join(', ')}`);
      }
      
      // Check notes without CM Twitter handles
      const notesWithoutHandles = notesData.filter(n => !n.cmTwitterHandle);
      if (notesWithoutHandles.length > 0) {
        console.warn(`  ⚠️  Notes without CM Twitter handles: ${notesWithoutHandles.length}`);
        const cmNamesWithoutHandles = new Set(notesWithoutHandles.map(n => n.cmName));
        console.warn(`  ⚠️  CMs without handles: ${Array.from(cmNamesWithoutHandles).join(', ')}`);
      }
      
      console.log('========== END COMPREHENSIVE DEBUG ==========\n');
    };
    
    // Call debug function
    debugAllData();
    
    setUsers(userList);
    setLastUpdated(new Date());
    
    // Preload profile images in background
    const allHandles = [
      ...userList.map(user => user.twitterHandle),
      ...Array.from(cmHandleMap.keys()),
      ...Array.from(dAppHandleMap.keys())
    ];
    
    console.log(`[HomePage] Preloading ${allHandles.length} profile images in background`);
    ProfileImageCacheService.preloadAllImages(allHandles).then(() => {
      console.log(`[HomePage] Profile images preloading completed`);
    });
    
    // Start background loading of note contents
    setTimeout(() => {
      loadNoteContentsInBackground(notesData);
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
      const [projectNotes, permissionData] = await Promise.all([
        queryNotesByProject(selectedProject),
        queryCMPermissions(selectedProject)
      ]);
      
      const cmTwitterHandles = permissionData.cmNameToHandle;
      const handleToLatestName = permissionData.handleToLatestName;
      
      // Notes already have CM Twitter handles from unified data
      console.log(`[HomePage] CM Twitter handles from permissions (for comparison):`, Array.from(cmTwitterHandles?.entries() || []));
      
      // CM name to handle mapping will be set by processCMData
      
      // Count notes with and without CM Twitter handles
      const notesWithHandles = projectNotes.filter(note => note.cmTwitterHandle).length;
      const notesWithoutHandles = projectNotes.filter(note => !note.cmTwitterHandle).length;
      
      console.log(`[HomePage] Notes with CM Twitter handles: ${notesWithHandles}`);
      console.log(`[HomePage] Notes without CM Twitter handles: ${notesWithoutHandles}`);
      
      const enrichedNotes = projectNotes;
      
      setNotes(enrichedNotes);
      
      // Process CM data first to get merged CM info
      const { cmInfoList, dAppInfoList, cmNameToHandleMap } = processCMData(enrichedNotes, cmTwitterHandles, handleToLatestName);
      setCmNameToHandleMap(cmNameToHandleMap);
      
      // Process notes to users with merged CM data
      processNotesToUsers(enrichedNotes, cmInfoList, dAppInfoList);
      
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
      queryCMPermissions(selectedProject).then(permissionData => {
        const { cmInfoList, dAppInfoList, cmNameToHandleMap } = processCMData(
          cachedNotes, 
          permissionData.cmNameToHandle, 
          permissionData.handleToLatestName
        );
        setCmNameToHandleMap(cmNameToHandleMap);
        processNotesToUsers(cachedNotes, cmInfoList, dAppInfoList);
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
      setDisplayedDApps(dAppInfos);
    } else {
      setDisplayedDApps(dAppInfos.slice(0, DEFAULT_CM_LIMIT));
    }
  }, [dAppInfos, showAllDApps]);

  // Reset showAllUsers and showAllCMs when filters change
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
      const selectedDAppInfo = dAppInfos.find(dApp => dApp.name === selectedCM);
      
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
      } else if (selectedDAppInfo) {
        // Filter by dApp Twitter handle
        const normalizedDAppHandle = selectedDAppInfo.twitterHandle.toLowerCase();
        
        filtered = filtered.filter(user => 
          user.notes.some(note => {
            if (note.cmTwitterHandle) {
              const normalizedNoteHandle = (note.cmTwitterHandle.startsWith('@') ? 
                note.cmTwitterHandle.substring(1) : note.cmTwitterHandle).toLowerCase();
              return normalizedNoteHandle === normalizedDAppHandle;
            }
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
              <SocialGraph notes={notes} cmInfos={cmInfos} dAppInfos={dAppInfos} cmNameToHandleMap={cmNameToHandleMap} />
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
              cms={hasDataLoaded ? [...cmInfos.map(cm => cm.cmName), ...dAppInfos.map(dApp => dApp.name)].sort() : []}
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
          {dAppInfos.length > 0 && (
            <section id="dapps" className="cm-section">
              <h2 className="section-title">dApps</h2>
              <div className="cm-grid">
                {displayedDApps.length > 0 ? (
                  displayedDApps.map(dAppInfo => (
                    <CMCard
                      key={dAppInfo.name}
                      cmInfo={{
                        cmName: dAppInfo.name,
                        cmTwitterHandle: dAppInfo.twitterHandle,
                        noteCount: dAppInfo.noteCount,
                        recentUsers: dAppInfo.recentUsers,
                        recentNotes: dAppInfo.recentNotes
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

              {!showAllDApps && dAppInfos.length > DEFAULT_CM_LIMIT && (
                <div className="show-all-container">
                  <button 
                    onClick={handleShowAllDApps}
                    className="show-all-button"
                  >
                    Show All ({dAppInfos.length - DEFAULT_CM_LIMIT} more)
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

      {activeTab === 'metaverse' && (
        <section id="metaverse-view" className="metaverse-section">
          <WorkAdventureIntegration />
        </section>
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