import { useState, useEffect, useRef } from 'react';
import cytoscape, { Core } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { Note } from '../types';
import { ProfileImageCacheService } from '../services/profileImageCache';
import { cmDataService } from '../services/cmDataService';
import './SocialGraph.css';

// Register the fcose layout
cytoscape.use(fcose);

interface SocialGraphProps {
  notes: Note[];
  cmInfos: Array<{
    cmName: string;
    cmTwitterHandle?: string;
    noteCount: number;
  }>;
  dappInfos?: Array<{
    dappName: string;
    dappTwitterHandle: string;
    noteCount: number;
  }>;
}

function SocialGraph({ notes, cmInfos, dappInfos = [] }: SocialGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || notes.length === 0) {
      setLoading(false);
      return;
    }

    // Destroy previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const createGraph = async () => {
      console.log('[SocialGraph] Starting to create graph');
      
      // Process data
      const elements: cytoscape.ElementDefinition[] = [];
      const nodeMap = new Map<string, { isCM: boolean; twitterHandle?: string; label: string; displayName?: string }>();
      const edgeMap = new Map<string, number>();

      // Helper function to normalize handles
      const normalizeHandle = (handle: string): string => {
        return (handle.startsWith('@') ? handle.substring(1) : handle).toLowerCase();
      };

      // Create a map of all CMs (by normalized Twitter handle) for quick lookup
      const cmHandleMap = new Map<string, { cmName: string; cmTwitterHandle: string }>(); // normalized handle -> cmInfo
      console.log('[SocialGraph] Processing CM infos:', cmInfos.length);
      cmInfos.forEach(cmInfo => {
        console.log(`[SocialGraph] CM: ${cmInfo.cmName}, handle: ${cmInfo.cmTwitterHandle}, notes: ${cmInfo.noteCount}`);
        if (cmInfo.cmTwitterHandle) {
          const normalizedHandle = normalizeHandle(cmInfo.cmTwitterHandle);
          cmHandleMap.set(normalizedHandle, {
            cmName: cmInfo.cmName,
            cmTwitterHandle: normalizedHandle
          });
        }
      });

      // Track which nodes should be displayed
      const nodesToDisplay = new Set<string>();

      // First pass: identify all nodes that should be displayed (using normalized handles)
      notes.forEach(note => {
        // CM who wrote the note - use cmTwitterHandle from note if available
        if (note.cmTwitterHandle) {
          const normalizedCmHandle = normalizeHandle(note.cmTwitterHandle);
          nodesToDisplay.add(normalizedCmHandle);
        } else {
          // Fallback: try to find CM by name using CM data service
          const cmHandle = cmDataService.getHandleByName(note.cmName);
          if (cmHandle) {
            nodesToDisplay.add(normalizeHandle(cmHandle));
            console.log(`[SocialGraph] Found CM handle by name: ${note.cmName} -> ${cmHandle}`);
          } else {
            console.log(`[SocialGraph] Warning: No handle found for CM: ${note.cmName}`);
          }
        }
        
        // User/CM who received the note - they might also be a CM
        const normalizedUserHandle = normalizeHandle(note.twitterHandle);
        nodesToDisplay.add(normalizedUserHandle);
      });

      // Create dApp handle map
      const dappHandleMap = new Map<string, { dappName: string; dappTwitterHandle: string }>();
      dappInfos.forEach(dappInfo => {
        if (dappInfo.dappTwitterHandle) {
          const normalizedHandle = normalizeHandle(dappInfo.dappTwitterHandle);
          dappHandleMap.set(normalizedHandle, {
            dappName: dappInfo.dappName,
            dappTwitterHandle: normalizedHandle
          });
          console.log(`[SocialGraph] dApp: ${dappInfo.dappName}, handle: ${dappInfo.dappTwitterHandle}`);
        }
      });

      // Create a set of all CM handles for quick lookup
      const allCmHandles = new Set<string>();
      cmInfos.forEach(cmInfo => {
        if (cmInfo.cmTwitterHandle) {
          allCmHandles.add(normalizeHandle(cmInfo.cmTwitterHandle));
        }
      });
      
      // Create a set of all dApp handles
      const allDappHandles = new Set<string>();
      dappInfos.forEach(dappInfo => {
        if (dappInfo.dappTwitterHandle) {
          allDappHandles.add(normalizeHandle(dappInfo.dappTwitterHandle));
        }
      });

      // Second pass: create nodes
      nodesToDisplay.forEach(normalizedHandle => {
        if (!nodeMap.has(normalizedHandle)) {
          let label = `@${normalizedHandle}`;
          let displayName: string | undefined;
          let nodeType = 'user';
          
          // Check using CM data service
          if (cmDataService.isDApp(normalizedHandle)) {
            // It's a dApp
            const currentName = cmDataService.getCurrentNameByHandle(normalizedHandle);
            if (currentName) {
              label = currentName;
              displayName = currentName;
              nodeType = 'dapp';
            } else {
              // Fallback to dappInfos
              const foundDapp = dappInfos.find(dapp => 
                dapp.dappTwitterHandle && normalizeHandle(dapp.dappTwitterHandle) === normalizedHandle
              );
              if (foundDapp) {
                label = foundDapp.dappName;
                displayName = foundDapp.dappName;
                nodeType = 'dapp';
              }
            }
          } else if (cmDataService.isCM(normalizedHandle)) {
            // It's a CM
            const currentName = cmDataService.getCurrentNameByHandle(normalizedHandle);
            if (currentName) {
              label = currentName;
              displayName = currentName;
              nodeType = 'cm';
            } else {
              // Fallback to cmInfos
              const foundCm = cmInfos.find(cm => 
                cm.cmTwitterHandle && normalizeHandle(cm.cmTwitterHandle) === normalizedHandle
              );
              if (foundCm) {
                label = foundCm.cmName;
                displayName = foundCm.cmName;
                nodeType = 'cm';
              }
            }
          }
          
          console.log(`[SocialGraph] Creating node: ${normalizedHandle}, type: ${nodeType}, label: ${label}`);
          
          nodeMap.set(normalizedHandle, {
            isCM: nodeType === 'cm' || nodeType === 'dapp',
            twitterHandle: normalizedHandle,
            label,
            displayName
          });
        }
      });

      // Load profile images and create node elements
      const nodePromises = Array.from(nodeMap.entries()).map(async ([id, nodeInfo]) => {
        const handle = nodeInfo.twitterHandle || id;
        const imageUrl = await ProfileImageCacheService.loadProfileImage(handle);
        console.log(`[SocialGraph] Loaded image for ${handle}: ${imageUrl}`);
        
        return {
          data: {
            id,
            label: nodeInfo.label,
            type: nodeInfo.isCM ? 'cm' : 'user',
            twitterHandle: handle,
            image: imageUrl
          },
          classes: nodeInfo.isCM ? 'cm-node' : 'user-node'
        };
      });

      const nodeElements = await Promise.all(nodePromises);
      elements.push(...nodeElements);

      // Process edges
      notes.forEach(note => {
        let cmId: string | undefined;
        
        // Use cmTwitterHandle from note if available
        if (note.cmTwitterHandle) {
          cmId = normalizeHandle(note.cmTwitterHandle);
        } else {
          // Fallback: try to find CM by name (for legacy data)
          const cmInfo = cmInfos.find(cm => cm.cmName === note.cmName);
          if (cmInfo && cmInfo.cmTwitterHandle) {
            cmId = normalizeHandle(cmInfo.cmTwitterHandle);
          }
        }
        
        if (cmId) {
          const userId = normalizeHandle(note.twitterHandle);
          
          if (cmId !== userId) { // Avoid self-loops
            const edgeId = `${cmId}-${userId}`;
            edgeMap.set(edgeId, (edgeMap.get(edgeId) || 0) + 1);
          }
        }
      });

      // Create edge elements
      edgeMap.forEach((count, edgeId) => {
        const [source, target] = edgeId.split('-');
        elements.push({
          data: {
            id: edgeId,
            source,
            target,
            weight: count
          },
          classes: 'note-edge'
        });
      });

      console.log('[SocialGraph] Creating cytoscape instance with', elements.length, 'elements');

      // Create cytoscape instance
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-image': 'data(image)',
              'background-fit': 'cover',
              'background-clip': 'node',
              'background-color': '#e0e0e0',
              'background-opacity': 1,
              'label': 'data(label)',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'font-size': '12px',
              'font-weight': 'normal',
              'text-margin-y': 5,
              'border-width': 3,
              'border-opacity': 1,
              'shape': 'ellipse'
            }
          },
          {
            selector: '.cm-node',
            style: {
              'background-color': '#ffe4e4',
              'border-color': '#ff6b6b',
              'width': 50,
              'height': 50,
              'font-weight': 'bold',
              'font-size': '14px'
            }
          },
          {
            selector: '.user-node',
            style: {
              'background-color': '#e4f2ff',
              'border-color': '#4dabf7',
              'width': 40,
              'height': 40
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 'mapData(weight, 1, 10, 1, 5)',
              'line-color': '#999999',
              'line-opacity': 0.5,
              'curve-style': 'bezier',
              'target-arrow-shape': 'none'
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 5,
              'border-color': '#333333'
            }
          },
          {
            selector: 'node:active',
            style: {
              'overlay-padding': 0,
              'overlay-opacity': 0
            }
          }
        ],
        layout: {
          name: 'fcose',
          randomize: true,
          animate: true,
          animationDuration: 1000,
          animationEasing: 'ease-out',
          nodeDimensionsIncludeLabels: true,
          idealEdgeLength: 200,
          nodeRepulsion: 10000,
          nodeOverlap: 40,
          numIter: 2500,
          tile: false,
          tilingPaddingVertical: 10,
          tilingPaddingHorizontal: 10,
          gravity: 0.2,
          gravityRange: 3.8,
          padding: 100,
          stop: () => {
            console.log('[SocialGraph] Layout completed');
            setLoading(false);
          }
        } as any,
        minZoom: 0.3,
        maxZoom: 3,
        wheelSensitivity: 0.2
      });

      cyRef.current = cy;

      // Handle node clicks
      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        const twitterHandle = node.data('twitterHandle');
        if (twitterHandle) {
          window.open(`https://twitter.com/${twitterHandle}`, '_blank');
        }
      });

      // Change cursor on hover
      cy.on('mouseover', 'node', () => {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'pointer';
        }
      });

      cy.on('mouseout', 'node', () => {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
      });

      // Debug: Log node data
      cy.nodes().forEach(node => {
        console.log('[SocialGraph] Node:', node.id(), 'Image:', node.data('image'));
      });
    };

    createGraph();

    // Cleanup
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [notes, cmInfos, dappInfos]);

  return (
    <div className="social-graph">
      <h2 className="section-title">Social Network</h2>
      <div className="graph-info">
        <div className="legend">
          <div className="legend-item">
            <span className="legend-dot cm-dot"></span>
            <span>CM</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot user-dot"></span>
            <span>User</span>
          </div>
        </div>
      </div>
      <div className="graph-wrapper">
        <div className="floating-particles">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="particle"></div>
          ))}
        </div>
        <div ref={containerRef} className="cytoscape-container" />
        {loading && (
          <div className="graph-loading">
            <div className="spinner"></div>
            <p>Creating graph...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialGraph; 