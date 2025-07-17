import axios from 'axios';
import { Note, ProjectIcon } from '../types';

const IRYS_GATEWAY_URL = 'https://gateway.irys.xyz';
const IRYS_GRAPHQL_URL = 'https://uploader.irys.xyz/graphql';

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

    for (const edge of edges) {
      const node = edge.node;
      const tags = node.tags || [];
      
      const getTagValue = (tagName: string) => tags.find((t: any) => t.name === tagName)?.value;
      
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
        timestamp: node.timestamp,
        cmName: getTagValue('irys-cm-note-cm'),
        dataUrl: `${IRYS_GATEWAY_URL}/mutable/${getTagValue('Root-TX') || node.id}`
      };

      // Fetch note content
      try {
        const contentResponse = await axios.get(note.dataUrl);
        note.content = contentResponse.data.content || '';
      } catch (error) {
        console.error('Error fetching note content:', error);
      }

      notes.push(note);
    }

    return filterActiveNotes(notes);
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