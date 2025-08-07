import { useState, useEffect, useRef } from 'react';
import cytoscape, { Core } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { Note } from '../types';
import { ProfileImageCacheService } from '../services/profileImageCache';
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
}

function SocialGraph({ notes, cmInfos }: SocialGraphProps) {
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
      const nodeMap = new Map<string, { isCM: boolean; twitterHandle?: string; label: string }>();
      const edgeMap = new Map<string, number>();

      // Create a map of all CMs (by Twitter handle) for quick lookup
      const cmHandleMap = new Map<string, string>(); // handle -> cmName
      cmInfos.forEach(cmInfo => {
        const handle = cmInfo.cmTwitterHandle || cmInfo.cmName;
        cmHandleMap.set(handle, cmInfo.cmName);
      });

      // Track which nodes should be displayed
      const nodesToDisplay = new Set<string>();

      // First pass: identify all nodes that should be displayed
      notes.forEach(note => {
        // CM who wrote the note
        const cmHandle = cmInfos.find(cm => cm.cmName === note.cmName)?.cmTwitterHandle || note.cmName;
        nodesToDisplay.add(cmHandle);
        
        // User/CM who received the note
        nodesToDisplay.add(note.twitterHandle);
      });

      // Second pass: create nodes
      nodesToDisplay.forEach(handle => {
        if (!nodeMap.has(handle)) {
          // Check if this handle is a CM
          const isCM = cmHandleMap.has(handle);
          const cmName = cmHandleMap.get(handle);
          
          nodeMap.set(handle, {
            isCM,
            twitterHandle: handle,
            label: isCM && cmName ? cmName : handle
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
        const cmId = cmInfos.find(cm => cm.cmName === note.cmName)?.cmTwitterHandle || note.cmName;
        const userId = note.twitterHandle;
        
        if (cmId !== userId) { // Avoid self-loops
          const edgeId = `${cmId}-${userId}`;
          edgeMap.set(edgeId, (edgeMap.get(edgeId) || 0) + 1);
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
          idealEdgeLength: 120,
          nodeRepulsion: 5000,
          nodeOverlap: 20,
          numIter: 2500,
          tile: false,
          tilingPaddingVertical: 10,
          tilingPaddingHorizontal: 10,
          gravity: 0.25,
          gravityRange: 3.8,
          // Performance optimizations for large networks
          initialEnergyOnIncremental: 0.5,
          stop: () => {
            console.log('[SocialGraph] Layout completed');
            setLoading(false);
            
            // Force a render update after layout completes
            setTimeout(() => {
              cy.resize();
              cy.fit();
            }, 100);
          }
        } as any,
        minZoom: 0.5,
        maxZoom: 3,
        wheelSensitivity: 0.2,
        // Performance settings
        textureOnViewport: true,
        motionBlur: false,
        hideEdgesOnViewport: true,
        hideLabelsOnViewport: true,
        pixelRatio: 'auto'
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
  }, [notes, cmInfos]);

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