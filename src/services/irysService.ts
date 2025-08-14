import axios from 'axios';
import { Note, ProjectIcon } from '../types';
import { debugTimestamp } from '../utils/dateUtils';

const IRYS_GATEWAY_URL = 'https://gateway.irys.xyz';
const IRYS_GRAPHQL_URL = 'https://uploader.irys.xyz/graphql';

// 통합 사용자 데이터 구조
interface UnifiedUserData {
  twitterHandle: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  projects: {
    [projectName: string]: {
      name: string;
      cms: {
        [cmName: string]: {
          name: string;
          twitterHandle?: string; // CM's Twitter handle
          notes: Array<{
            id: string;
            twitterHandle: string;
            nickname: string;
            userType: string;
            content: string;
            badgeColor?: string;
            iconUrl?: string;
            project: string;
            cmName: string;
            status?: 'added' | 'removed' | 'edited';
            createdAt: string;
            updatedAt: string;
          }>;
          createdAt: string;
          updatedAt: string;
        };
      };
      createdAt: string;
      updatedAt: string;
    };
  };
}

// Helper function to properly handle timestamp from Irys
function parseIrysTimestamp(timestamp: any): number {
  if (!timestamp) return 0;
  
  // Convert to number if it's a string
  const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  
  // Debug the raw timestamp
  debugTimestamp(numTimestamp, 'Irys GraphQL');
  
  // Irys timestamps are Unix timestamps in seconds
  // We need to determine if the timestamp is in seconds or milliseconds
  // If the timestamp is less than year 2001 in milliseconds (< 978307200000),
  // it's likely in seconds and needs to be converted
  if (numTimestamp < 978307200000) {
    // It's in seconds, keep as is for our formatTimestamp function
    console.log(`[Irys] Timestamp is in seconds: ${numTimestamp}`);
    return numTimestamp;
  } else {
    // It's in milliseconds, convert to seconds for our formatTimestamp function
    const convertedTimestamp = Math.floor(numTimestamp / 1000);
    console.log(`[Irys] Timestamp is in milliseconds: ${numTimestamp} -> ${convertedTimestamp} seconds`);
    return convertedTimestamp;
  }
}

// Query unified user data for a specific project
export async function queryUnifiedUserData(project: string): Promise<Note[]> {
  const query = `
    query getUnifiedUserData {
      transactions(
        tags: [
          { name: "App-Name", values: ["irys-cm-note-unified"] }
        ],
        first: 1000,
        order: DESC
      ) {
        edges {
          node {
            id
            tags {
              name
              value
            }
            timestamp
          }
        }
      }
    }
  `;

  try {
    console.log(`[IrysService] Starting unified data query for project: ${project}`);
    const startTime = Date.now();
    
    const response = await axios.post(IRYS_GRAPHQL_URL, {
      query
    });

    const edges = response.data?.data?.transactions?.edges || [];
    const notes: Note[] = [];
    
    // Group transactions by Twitter handle to get latest for each user
    const userTransactions = new Map<string, any>();
    
    for (const edge of edges) {
      const node = edge.node;
      const tags = node.tags || [];
      const timestamp = parseIrysTimestamp(node.timestamp);
      
      const getTagValue = (tagName: string) => tags.find((t: any) => t.name === tagName)?.value;
      const twitterHandle = getTagValue('Twitter-Handle');
      const rootTxTag = getTagValue('Root-TX');
      const rootTxId = rootTxTag || node.id;
      
      // Keep only the most recent transaction per user
      if (twitterHandle) {
        const existing = userTransactions.get(twitterHandle);
        if (!existing || timestamp > parseIrysTimestamp(existing.timestamp)) {
          userTransactions.set(twitterHandle, { node, rootTxId, timestamp });
        }
      }
    }
    
    console.log(`[IrysService] Found ${userTransactions.size} unique users with unified data`);
    
    // Fetch and process unified data for each user
    const fetchPromises = Array.from(userTransactions.entries()).map(async ([twitterHandle, { rootTxId }]) => {
      try {
        const mutableAddress = `${IRYS_GATEWAY_URL}/mutable/${rootTxId}`;
        const dataResponse = await axios.get(mutableAddress, {
          timeout: 10000 // 10 second timeout
        });
        const userData: UnifiedUserData = dataResponse.data;
        
        // Extract notes from unified data for the specified project
        if (userData.projects && userData.projects[project]) {
          const projectData = userData.projects[project];
          
          for (const cmName in projectData.cms) {
            const cmData = projectData.cms[cmName];
            
            // Extract CM Twitter handle from the CM data
            const cmTwitterHandle = cmData.twitterHandle ? 
              (cmData.twitterHandle.startsWith('@') ? cmData.twitterHandle.substring(1) : cmData.twitterHandle) : 
              undefined;
            
            console.log(`[IrysService] CM "${cmName}" has Twitter handle: @${cmTwitterHandle || 'N/A'}`);
            
            if (cmData.notes && Array.isArray(cmData.notes)) {
              // Process only active notes
              const activeNotes = cmData.notes.filter(note => note.status !== 'removed');
              
              for (const noteData of activeNotes) {
                // Convert unified note data to Note interface
                const note: Note = {
                  id: noteData.id || `${rootTxId}_${Date.now()}_${Math.random()}`,
                  rootTxId: rootTxId,
                  project: project,
                  twitterHandle: noteData.twitterHandle || twitterHandle,
                  user: noteData.nickname || noteData.twitterHandle || twitterHandle,
                  nickname: noteData.nickname || noteData.twitterHandle || twitterHandle,
                  userType: noteData.userType || 'user',
                  iconUrl: noteData.iconUrl || '',
                  content: noteData.content || '',
                  status: noteData.status || 'added',
                  timestamp: Math.floor(new Date(noteData.updatedAt || noteData.createdAt).getTime() / 1000),
                  cmName: cmName,
                  cmTwitterHandle: cmTwitterHandle, // Use the CM's Twitter handle from unified data
                  dataUrl: mutableAddress
                };
                
                notes.push(note);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching unified data for user ${twitterHandle}:`, error);
      }
    });
    
    // Process in batches to avoid overwhelming the server
    const BATCH_SIZE = 20;
    for (let i = 0; i < fetchPromises.length; i += BATCH_SIZE) {
      const batch = fetchPromises.slice(i, i + BATCH_SIZE);
      await Promise.all(batch);
      
      // Small delay between batches
      if (i + BATCH_SIZE < fetchPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Sort notes by timestamp
    notes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    console.log(`[IrysService] Loaded ${notes.length} notes from unified data in ${Date.now() - startTime}ms`);
    
    return notes;
  } catch (error) {
    console.error('Error querying unified user data:', error);
    return [];
  }
}

// Query all notes for a specific project (unified data only)
export async function queryNotesByProject(project: string): Promise<Note[]> {
  try {
    console.log(`[IrysService] Starting unified data query for project: ${project}`);
    const startTime = Date.now();
    
    // Query only unified data
    const unifiedNotes = await queryUnifiedUserData(project);
    
    console.log(`[IrysService] Query completed in ${Date.now() - startTime}ms`);
    console.log(`[IrysService] Total notes: ${unifiedNotes.length} from unified data`);
    
    return unifiedNotes;
  } catch (error) {
    console.error('Error in query:', error);
    return [];
  }
}



// Lazy load note content when needed
export async function loadNoteContent(note: Note): Promise<string> {
  // Content is already loaded from unified data
  if (note.content) {
    return note.content;
  }

  return '';
}

// Batch load content for multiple notes (content is already loaded from unified data)
export async function loadMultipleNoteContents(notes: Note[], onProgress?: (loaded: number, total: number) => void): Promise<Note[]> {
  // All notes from unified data already have content loaded
  console.log(`[IrysService] All notes already have content loaded from unified data`);
  
  if (onProgress) {
    onProgress(notes.length, notes.length);
  }
  
  return notes;
}

// Query icons for a project
export async function queryProjectIcons(project: string): Promise<ProjectIcon[]> {
  const query = `
    query getProjectIcons($project: String!) {
      transactions(
        tags: [
          { name: "App-Name", values: ["irys-cm-note"] }
          { name: "irys-cm-note-project", values: [$project] }
          { name: "irys-cm-note-type", values: ["icon"] }
        ],
        first: 100,
        order: DESC
      ) {
        edges {
          node {
            id
            tags {
              name
              value
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(IRYS_GRAPHQL_URL, {
      query,
      variables: { project }
    });

    const edges = response.data?.data?.transactions?.edges || [];
    const icons: ProjectIcon[] = [];

    for (const edge of edges) {
      const node = edge.node;
      const tags = node.tags || [];
      
      const getTagValue = (tagName: string) => tags.find((t: any) => t.name === tagName)?.value;
      
      const icon: ProjectIcon = {
        name: getTagValue('irys-cm-note-icon-name') || 'Unnamed Icon',
        url: `${IRYS_GATEWAY_URL}/${node.id}`,
        txId: node.id
      };

      icons.push(icon);
    }

    return icons;
  } catch (error) {
    console.error('Error querying icons:', error);
    return [];
  }
}

// Filter active notes (exclude removed ones)
export function filterActiveNotes(notes: Note[]): Note[] {
  const noteGroups: { [key: string]: Note[] } = {};
  
  // Group notes by rootTxId
  notes.forEach(note => {
    const rootId = note.rootTxId || note.id;
    if (!noteGroups[rootId]) {
      noteGroups[rootId] = [];
    }
    noteGroups[rootId].push(note);
  });

  // Get latest status for each note group
  const activeNotes: Note[] = [];
  
  Object.values(noteGroups).forEach(group => {
    // Sort by timestamp to get latest
    const sortedGroup = group.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const latestNote = sortedGroup[0];
    
    if (latestNote.status !== 'removed') {
      activeNotes.push(latestNote);
    }
  });

  return activeNotes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

// Query CM permissions to get CM Twitter handles
export async function queryCMPermissions(project: string): Promise<{ cmNameToHandle: Map<string, string>; handleToLatestName: Map<string, string> }> {
  const query = `
    query getCMPermissions($project: String!, $cursor: String) {
      transactions(
        tags: [
          { name: "App-Name", values: ["irys-cm-note-permission"] }
          { name: "irys-cm-note-project", values: [$project] }
        ],
        first: 100,
        after: $cursor,
        order: DESC
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            tags {
              name
              value
            }
            timestamp
          }
        }
      }
    }
  `;

  try {
    console.log(`[IrysService] Querying CM permissions for project: ${project}`);
    
    let allEdges: any[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;
    let pageCount = 0;
    
    // Fetch all pages
    while (hasNextPage && pageCount < 10) { // Limit to 10 pages for safety
      const response: any = await axios.post(IRYS_GRAPHQL_URL, {
        query,
        variables: { project, cursor }
      });

      const data: any = response.data?.data?.transactions;
      const edges = data?.edges || [];
      allEdges = [...allEdges, ...edges];
      
      hasNextPage = data?.pageInfo?.hasNextPage || false;
      cursor = data?.pageInfo?.endCursor || null;
      pageCount++;
      
      console.log(`[IrysService] Fetched page ${pageCount}, got ${edges.length} entries, hasNextPage: ${hasNextPage}`);
    }
    
    console.log(`[IrysService] Total permission entries fetched: ${allEdges.length}`);
    const cmTwitterHandles = new Map<string, string>();

    // Get the most recent permission entry for each Twitter handle
    const handleToLatestCM = new Map<string, { cmName: string; timestamp: number }>();
    // Also track all CM names that have been used by each handle
    const handleToAllNames = new Map<string, Set<string>>();

    for (const edge of allEdges) {
      const node = edge.node;
      const tags = node.tags || [];
      
      const getTagValue = (tagName: string) => tags.find((t: any) => t.name === tagName)?.value;
      
      const cmName = getTagValue('irys-cm-note-cm');
      const twitterHandle = getTagValue('irys-cm-note-twitter-handle');
      const timestamp = parseIrysTimestamp(node.timestamp);

      if (cmName && twitterHandle) {
        // Remove @ prefix if present and convert to lowercase for consistency
        const cleanHandle = (twitterHandle.startsWith('@') 
          ? twitterHandle.substring(1) 
          : twitterHandle).toLowerCase();
        
        // Filter out known bad data entries
        // xaitoshi should not be associated with wojacklabs
        if (cmName.toLowerCase() === 'xaitoshi' && cleanHandle === 'wojacklabs') {
          console.warn(`[IrysService] Filtering out incorrect permission entry: CM "${cmName}" should not be associated with @${cleanHandle}`);
          continue;
        }
        
        // Special logging for problematic accounts
        if (cleanHandle === 'wojacklabs' || cmName.toLowerCase().includes('xaitoshi')) {
          console.log(`[IrysService] DEBUG: Found permission - CM: "${cmName}", Handle: @${cleanHandle}, Timestamp: ${timestamp}`);
        }
        
        // Track all names used by this handle
        if (!handleToAllNames.has(cleanHandle)) {
          handleToAllNames.set(cleanHandle, new Set());
        }
        handleToAllNames.get(cleanHandle)!.add(cmName);
        
        // Check if this is the most recent entry for this Twitter handle
        if (!handleToLatestCM.has(cleanHandle) || timestamp > handleToLatestCM.get(cleanHandle)!.timestamp) {
          handleToLatestCM.set(cleanHandle, { cmName, timestamp });
          console.log(`[IrysService] Updated CM name for @${cleanHandle}: ${cmName} (timestamp: ${timestamp})`);
        }
      }
    }
    
    // Convert to cmName -> handle map for ALL CM names (including old ones)
    handleToAllNames.forEach((names, handle) => {
      names.forEach(name => {
        // Skip adding the filtered out bad mappings
        if (name.toLowerCase() === 'xaitoshi' && handle === 'wojacklabs') {
          return;
        }
        cmTwitterHandles.set(name, handle);
        console.log(`[IrysService] Mapping CM name: ${name} -> @${handle}`);
      });
    });

    console.log(`[IrysService] Found ${cmTwitterHandles.size} CM Twitter handles`);
    
    // Also return the latest CM name for each handle
    const handleToLatestName = new Map<string, string>();
    handleToLatestCM.forEach((data, handle) => {
      handleToLatestName.set(handle, data.cmName);
    });
    
    return { cmNameToHandle: cmTwitterHandles, handleToLatestName };
  } catch (error) {
    console.error('Error querying CM permissions:', error);
    return { cmNameToHandle: new Map(), handleToLatestName: new Map() };
  }
}

// Get all unique projects from unified data only
export async function getAllProjects(): Promise<string[]> {
  try {
    // Query unified data
    const unifiedQuery = `
      query getAllUnifiedData {
        transactions(
          tags: [
            { name: "App-Name", values: ["irys-cm-note-unified"] }
          ],
          first: 1000,
          order: DESC
        ) {
        edges {
          node {
            id
            tags {
              name
              value
            }
            timestamp
          }
        }
      }
    }
  `;

    const unifiedResponse = await axios.post(IRYS_GRAPHQL_URL, { query: unifiedQuery });

    const projectSet = new Set<string>();
    
    // Process unified data
    const unifiedEdges = unifiedResponse.data?.data?.transactions?.edges || [];
    const userTransactions = new Map<string, any>();
    
    // Get latest transaction per user
    for (const edge of unifiedEdges) {
      const node = edge.node;
      const tags = node.tags || [];
      const timestamp = parseIrysTimestamp(node.timestamp);
      
      const getTagValue = (tagName: string) => tags.find((t: any) => t.name === tagName)?.value;
      const twitterHandle = getTagValue('Twitter-Handle');
      const rootTxTag = getTagValue('Root-TX');
      const rootTxId = rootTxTag || node.id;
      
      if (twitterHandle) {
        const existing = userTransactions.get(twitterHandle);
        if (!existing || timestamp > parseIrysTimestamp(existing.timestamp)) {
          userTransactions.set(twitterHandle, { rootTxId, timestamp });
        }
      }
    }
    
    // Fetch unified data for each user to get projects
    const fetchPromises = Array.from(userTransactions.entries()).map(async ([twitterHandle, { rootTxId }]) => {
      try {
        const mutableAddress = `${IRYS_GATEWAY_URL}/mutable/${rootTxId}`;
        const dataResponse = await axios.get(mutableAddress, { timeout: 10000 });
        const userData: UnifiedUserData = dataResponse.data;
        
        if (userData.projects) {
          Object.keys(userData.projects).forEach(projectName => {
            projectSet.add(projectName);
          });
        }
      } catch (error) {
        console.error(`Error fetching unified data for projects from user ${twitterHandle}:`, error);
      }
    });
    
    // Process in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < fetchPromises.length; i += BATCH_SIZE) {
      const batch = fetchPromises.slice(i, i + BATCH_SIZE);
      await Promise.all(batch);
    }

    const projects = Array.from(projectSet).sort();
    console.log(`[IrysService] Found ${projects.length} unique projects from unified data`);
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
} 