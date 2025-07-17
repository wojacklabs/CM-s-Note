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

// Query all notes for a specific project
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
    const response = await axios.post(IRYS_GRAPHQL_URL, {
      query,
      variables: { project }
    });

    const edges = response.data?.data?.transactions?.edges || [];
    const notes: Note[] = [];

    console.log(`[IrysService] Fetched ${edges.length} transactions for project ${project}`);

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
        content: '',
        status: getTagValue('irys-cm-note-status') || 'added',
        timestamp: parsedTimestamp,
        cmName: getTagValue('irys-cm-note-cm'),
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

      // Fetch note content
      try {
        const contentResponse = await axios.get(note.dataUrl);
        note.content = contentResponse.data.content || '';
      } catch (error) {
        console.error('Error fetching note content:', error);
      }

      notes.push(note);
    }

    const activeNotes = filterActiveNotes(notes);
    console.log(`[IrysService] Filtered to ${activeNotes.length} active notes`);
    
    return activeNotes;
  } catch (error) {
    console.error('Error querying notes:', error);
    return [];
  }
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