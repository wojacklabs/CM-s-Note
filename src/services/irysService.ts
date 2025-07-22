import axios from 'axios';
import { Note, ProjectIcon } from '../types';
import { debugTimestamp } from '../utils/dateUtils';

const IRYS_GATEWAY_URL = 'https://gateway.irys.xyz';
const IRYS_GRAPHQL_URL = 'https://uploader.irys.xyz/graphql';

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

// Query all notes for a specific project (optimized - no content fetching)
export async function queryNotesByProject(project: string): Promise<Note[]> {
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
    console.log(`[IrysService] Starting query for project: ${project}`);
    const startTime = Date.now();
    
    const response = await axios.post(IRYS_GRAPHQL_URL, {
      query,
      variables: { project }
    });

    const edges = response.data?.data?.transactions?.edges || [];
    const notes: Note[] = [];

    console.log(`[IrysService] Fetched ${edges.length} transactions for project ${project} in ${Date.now() - startTime}ms`);

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
        userType: getTagValue('irys-cm-note-user-type'),
        iconUrl: getTagValue('irys-cm-note-Icon'),
        content: getTagValue('irys-cm-note-content') || '', // Load content from tag
        status: getTagValue('irys-cm-note-status') || 'added',
        timestamp: parsedTimestamp,
        cmName: getTagValue('irys-cm-note-cm'),
        cmTwitterHandle: getTagValue('irys-cm-note-cm-twitter-handle'),
        dataUrl: `${IRYS_GATEWAY_URL}/mutable/${getTagValue('Root-TX') || node.id}`
      };

      // Log first few notes for debugging
      if (notes.length < 3) {
        console.log(`[IrysService] Note ${notes.length + 1}:`, {
          id: note.id.substring(0, 8) + '...',
          timestamp: note.timestamp,
          twitterHandle: note.twitterHandle,
          cmName: note.cmName
        });
      }

      notes.push(note);
    }

    const activeNotes = filterActiveNotes(notes);
    console.log(`[IrysService] Filtered to ${activeNotes.length} active notes in ${Date.now() - startTime}ms total`);
    
    return activeNotes;
  } catch (error) {
    console.error('Error querying notes:', error);
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
function filterActiveNotes(notes: Note[]): Note[] {
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

// Get all unique projects
export async function getAllProjects(): Promise<string[]> {
  const query = `
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

  try {
    const response = await axios.post(IRYS_GRAPHQL_URL, { query });
    const edges = response.data?.data?.transactions?.edges || [];
    
    const projectSet = new Set<string>();
    
    edges.forEach((edge: any) => {
      const tags = edge.node.tags || [];
      const projectTag = tags.find((t: any) => t.name === 'irys-cm-note-project');
      if (projectTag?.value) {
        projectSet.add(projectTag.value);
      }
    });

    return Array.from(projectSet).sort();
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
} 