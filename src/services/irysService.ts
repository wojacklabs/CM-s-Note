import axios from 'axios';
import { Note, ProjectIcon } from '../types';
import { debugTimestamp } from '../utils/dateUtils';

const IRYS_GATEWAY_URL = 'https://gateway.irys.xyz';
const IRYS_GRAPHQL_URL = 'https://uploader.irys.xyz/graphql';

// 통합 사용자 데이터 구조
interface UnifiedUserData {
  version: string;
  updatedAt: number;
  projects: {
    [projectName: string]: {
      cms: {
        [cmName: string]: {
          notes: Array<{
            id: string;
            rootTxId: string;
            content: string;
            status: 'added' | 'removed' | 'edited';
            timestamp: number;
            iconUrl?: string;
            iconName?: string;
            updatedAt: number;
          }>;
        };
      };
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
            
            if (cmData.notes && Array.isArray(cmData.notes)) {
              // Process only active notes
              const activeNotes = cmData.notes.filter(note => note.status !== 'removed');
              
              for (const noteData of activeNotes) {
                // Convert unified note data to Note interface
                const note: Note = {
                  id: noteData.id || `${rootTxId}_${Date.now()}_${Math.random()}`,
                  rootTxId: rootTxId,
                  project: project,
                  twitterHandle: twitterHandle,
                  user: twitterHandle,
                  nickname: twitterHandle,
                  userType: 'unified',
                  iconUrl: noteData.iconUrl || '',
                  content: noteData.content || '',
                  status: noteData.status || 'added',
                  timestamp: Math.floor(new Date(noteData.updatedAt || noteData.timestamp).getTime() / 1000),
                  cmName: cmName,
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

// Query all notes for a specific project (combined unified and individual notes)
export async function queryNotesByProject(project: string): Promise<Note[]> {
  try {
    console.log(`[IrysService] Starting combined query for project: ${project}`);
    const startTime = Date.now();
    
    // Query both unified data and individual notes in parallel
    const [unifiedNotes, individualNotes] = await Promise.all([
      queryUnifiedUserData(project),
      queryIndividualNotes(project)
    ]);
    
    // Combine results
    const allNotes = [...unifiedNotes, ...individualNotes];
    
    // Remove duplicates based on rootTxId (prefer unified data)
    const uniqueNotesMap = new Map<string, Note>();
    
    // Add unified notes first (higher priority)
    unifiedNotes.forEach(note => {
      uniqueNotesMap.set(note.rootTxId, note);
    });
    
    // Add individual notes only if not already present
    individualNotes.forEach(note => {
      if (!uniqueNotesMap.has(note.rootTxId)) {
        uniqueNotesMap.set(note.rootTxId, note);
      }
    });
    
    const uniqueNotes = Array.from(uniqueNotesMap.values());
    const sortedNotes = uniqueNotes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    console.log(`[IrysService] Combined query completed in ${Date.now() - startTime}ms`);
    console.log(`[IrysService] Total notes: ${allNotes.length} (${unifiedNotes.length} unified, ${individualNotes.length} individual)`);
    console.log(`[IrysService] Unique notes after deduplication: ${sortedNotes.length}`);
    
    return sortedNotes;
  } catch (error) {
    console.error('Error in combined query:', error);
    return [];
  }
}

// Query individual notes (legacy method)
async function queryIndividualNotes(project: string): Promise<Note[]> {
  const query = `
    query getNotesByProject($project: String!) {
      transactions(
        tags: [
          { name: "App-Name", values: ["irys-cm-note"] }
          { name: "irys-cm-note-project", values: [$project] }
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
    console.log(`[IrysService] Starting individual notes query for project: ${project}`);
    const startTime = Date.now();
    
    const response = await axios.post(IRYS_GRAPHQL_URL, {
      query,
      variables: { project }
    });

    const edges = response.data?.data?.transactions?.edges || [];
    const notes: Note[] = [];

    console.log(`[IrysService] Fetched ${edges.length} individual transactions for project ${project} in ${Date.now() - startTime}ms`);

    for (const edge of edges) {
      const node = edge.node;
      const tags = node.tags || [];
      
      const getTagValue = (tagName: string) => tags.find((t: any) => t.name === tagName)?.value;
      
      // Parse timestamp properly
      const parsedTimestamp = parseIrysTimestamp(node.timestamp);
      
      const note: Note = {
        id: node.id,
        rootTxId: getTagValue('Root-TX') || node.id,
        project: getTagValue('irys-cm-note-project'),
        twitterHandle: getTagValue('irys-cm-note-twitter-handle'),
        user: getTagValue('irys-cm-note-user'),
        nickname: getTagValue('irys-cm-note-user'),
        userType: getTagValue('irys-cm-note-user-type') || 'individual',
        iconUrl: getTagValue('irys-cm-note-Icon'),
        content: getTagValue('irys-cm-note-content') || '', // Load content from tag
        status: getTagValue('irys-cm-note-status') || 'added',
        timestamp: parsedTimestamp,
        cmName: getTagValue('irys-cm-note-cm'),
        cmTwitterHandle: getTagValue('irys-cm-note-cm-twitter-handle'),
        dataUrl: `${IRYS_GATEWAY_URL}/mutable/${getTagValue('Root-TX') || node.id}`
      };

      notes.push(note);
    }

    const activeNotes = filterActiveNotes(notes);
    console.log(`[IrysService] Filtered to ${activeNotes.length} active individual notes in ${Date.now() - startTime}ms total`);
    
    return activeNotes;
  } catch (error) {
    console.error('Error querying individual notes:', error);
    return [];
  }
}

// Lazy load note content when needed (now simplified since content is loaded from tags)
export async function loadNoteContent(note: Note): Promise<string> {
  // Content is now loaded directly from tags in queryNotesByProject
  if (note.content) {
    return note.content;
  }

  // Fallback for legacy notes or edge cases
  try {
    if (note.dataUrl) {
      const contentResponse = await axios.get(note.dataUrl);
      const content = contentResponse.data.content || '';
      return content;
    }
  } catch (error) {
    console.error('Error fetching note content:', error);
  }

  return '';
}

// Batch load content for multiple notes (for performance) - Simplified since content is now in tags
export async function loadMultipleNoteContents(notes: Note[], onProgress?: (loaded: number, total: number) => void): Promise<Note[]> {
  const notesWithoutContent = notes.filter(note => !note.content && note.dataUrl);
  
  if (notesWithoutContent.length === 0) {
    console.log(`[IrysService] All notes already have content loaded from tags`);
    return notes; // All notes already have content
  }

  console.log(`[IrysService] Loading legacy content for ${notesWithoutContent.length} notes`);
  
  // Load content in parallel for legacy notes only
  const BATCH_SIZE = 15;
  const updatedNotes = [...notes];
  let loadedCount = 0;

  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < notesWithoutContent.length; i += BATCH_SIZE) {
    const batch = notesWithoutContent.slice(i, i + BATCH_SIZE);
    
    const contentPromises = batch.map(async (note) => {
      try {
        if (note.dataUrl) {
          const contentResponse = await axios.get(note.dataUrl, {
            timeout: 10000 // 10 second timeout
          });
          return {
            noteId: note.id,
            content: contentResponse.data.content || ''
          };
        }

        return {
          noteId: note.id,
          content: ''
        };
      } catch (error) {
        console.error(`Error fetching legacy content for note ${note.id}:`, error);
        return {
          noteId: note.id,
          content: ''
        };
      }
    });

    try {
      const contentResults = await Promise.all(contentPromises);
      
      // Update notes with loaded content
      contentResults.forEach(result => {
        const noteIndex = updatedNotes.findIndex(n => n.id === result.noteId);
        if (noteIndex !== -1) {
          updatedNotes[noteIndex] = {
            ...updatedNotes[noteIndex],
            content: result.content
          };
        }
      });

      loadedCount += contentResults.length;
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(loadedCount, notesWithoutContent.length);
      }

      console.log(`[IrysService] Loaded legacy batch ${Math.floor(i / BATCH_SIZE) + 1}, total progress: ${loadedCount}/${notesWithoutContent.length}`);
      
      // Small delay between batches to avoid overwhelming the server
      if (i + BATCH_SIZE < notesWithoutContent.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error loading batch starting at ${i}:`, error);
      // Continue with next batch even if current batch fails
    }
  }

  console.log(`[IrysService] Completed loading legacy content for ${loadedCount}/${notesWithoutContent.length} notes`);
  return updatedNotes;
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
export async function queryCMPermissions(project: string): Promise<Map<string, string>> {
  const query = `
    query getCMPermissions($project: String!) {
      transactions(
        tags: [
          { name: "App-Name", values: ["irys-cm-note-permission"] }
          { name: "irys-cm-note-project", values: [$project] }
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
            timestamp
          }
        }
      }
    }
  `;

  try {
    console.log(`[IrysService] Querying CM permissions for project: ${project}`);
    const response = await axios.post(IRYS_GRAPHQL_URL, {
      query,
      variables: { project }
    });

    const edges = response.data?.data?.transactions?.edges || [];
    const cmTwitterHandles = new Map<string, string>();

    // Get the most recent permission entry for each CM
    const cmLatestTimestamp = new Map<string, number>();

    for (const edge of edges) {
      const node = edge.node;
      const tags = node.tags || [];
      
      const getTagValue = (tagName: string) => tags.find((t: any) => t.name === tagName)?.value;
      
      const cmName = getTagValue('irys-cm-note-cm');
      const twitterHandle = getTagValue('irys-cm-note-twitter-handle');
      const timestamp = parseIrysTimestamp(node.timestamp);

      if (cmName && twitterHandle) {
        // Only update if this is the most recent entry for this CM
        if (!cmLatestTimestamp.has(cmName) || timestamp > cmLatestTimestamp.get(cmName)!) {
          cmTwitterHandles.set(cmName, twitterHandle);
          cmLatestTimestamp.set(cmName, timestamp);
          console.log(`[IrysService] Found Twitter handle for CM ${cmName}: @${twitterHandle}`);
        }
      }
    }

    console.log(`[IrysService] Found ${cmTwitterHandles.size} CM Twitter handles`);
    return cmTwitterHandles;
  } catch (error) {
    console.error('Error querying CM permissions:', error);
    return new Map();
  }
}

// Get all unique projects from both unified and individual data
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

    // Query individual notes
    const individualQuery = `
      query getAllProjects {
        transactions(
          tags: [
            { name: "App-Name", values: ["irys-cm-note"] }
          ],
          first: 1000,
          order: DESC
        ) {
          edges {
            node {
              tags {
                name
                value
              }
            }
          }
        }
      }
    `;

    // Execute both queries in parallel
    const [unifiedResponse, individualResponse] = await Promise.all([
      axios.post(IRYS_GRAPHQL_URL, { query: unifiedQuery }),
      axios.post(IRYS_GRAPHQL_URL, { query: individualQuery })
    ]);

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
    
    // Process individual notes for projects
    const individualEdges = individualResponse.data?.data?.transactions?.edges || [];
    individualEdges.forEach((edge: any) => {
      const tags = edge.node.tags || [];
      const projectTag = tags.find((t: any) => t.name === 'irys-cm-note-project');
      if (projectTag?.value) {
        projectSet.add(projectTag.value);
      }
    });

    const projects = Array.from(projectSet).sort();
    console.log(`[IrysService] Found ${projects.length} unique projects`);
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
} 