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
  dAppInfos?: Array<{
    name: string;
    twitterHandle: string;
    noteCount: number;
  }>;
  cmNameToHandleMap?: Map<string, string>; // All CM names (including old ones) to handle mapping
}

function SocialGraph({ notes, cmInfos, dAppInfos = [], cmNameToHandleMap }: SocialGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // milliseconds per step
  const animationIntervalRef = useRef<number | null>(null);
  const [minTimestamp, setMinTimestamp] = useState<number>(0);
  const [maxTimestamp, setMaxTimestamp] = useState<number>(0);
  const [isGraphInitialized, setIsGraphInitialized] = useState(false);
  const isMountedRef = useRef(true);

  // Helper function to normalize handles
  const normalizeHandle = (handle: string): string => {
    return (handle.startsWith('@') ? handle.substring(1) : handle).toLowerCase();
  };

  // Initialize timestamp range
  useEffect(() => {
    if (notes.length > 0) {
      const timestamps = notes.map(note => note.timestamp || 0).filter(ts => ts > 0);
      if (timestamps.length > 0) {
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        setMinTimestamp(min);
        setMaxTimestamp(max);
        setCurrentTimestamp(max); // Start with full graph
      }
    }
  }, [notes]);

  // Update graph visibility based on timestamp
  const updateGraphVisibility = () => {
    if (!cyRef.current || !isGraphInitialized || currentTimestamp === null) {
      console.log('[updateGraphVisibility] Early return:', {
        hasCy: !!cyRef.current,
        isInitialized: isGraphInitialized,
        timestamp: currentTimestamp
      });
      return;
    }

    const cy = cyRef.current;
    
    // Check if cy is still valid
    if (!cy.container()) {
      console.error('[updateGraphVisibility] Cytoscape container is null!');
      return;
    }
    
    // First, hide all elements
    cy.elements().addClass('hidden-element');
    
    // Determine which elements should be visible based on timestamp
    const visibleNodes = new Set<string>();
    const visibleEdges = new Set<string>();
    
    notes.forEach(note => {
      if ((note.timestamp || 0) <= currentTimestamp) {
        // Add user node
        const userHandle = normalizeHandle(note.twitterHandle);
        visibleNodes.add(userHandle);
        
        // Add CM/dApp node
        let cmHandle: string | undefined;
        if (note.cmTwitterHandle) {
          cmHandle = normalizeHandle(note.cmTwitterHandle);
        } else {
          // Handle legacy data
          const dAppInfo = dAppInfos.find(dApp => dApp.name === note.cmName);
          if (dAppInfo) {
            cmHandle = normalizeHandle(dAppInfo.twitterHandle);
          } else if (cmNameToHandleMap?.has(note.cmName)) {
            const handle = cmNameToHandleMap.get(note.cmName)!;
            cmHandle = normalizeHandle(handle);
          } else {
            const cmInfo = cmInfos.find(cm => cm.cmName === note.cmName);
            if (cmInfo?.cmTwitterHandle) {
              cmHandle = normalizeHandle(cmInfo.cmTwitterHandle);
            }
          }
        }
        
        if (cmHandle) {
          visibleNodes.add(cmHandle);
          
          // Add edge
          if (cmHandle !== userHandle) {
            const edgeId = `edge_${cmHandle}_to_${userHandle}`;
            visibleEdges.add(edgeId);
          }
        }
      }
    });
    
    // Show visible nodes
    visibleNodes.forEach(nodeId => {
      const node = cy.getElementById(nodeId);
      if (node.length > 0) {
        node.removeClass('hidden-element');
      }
    });
    
    // Show visible edges
    visibleEdges.forEach(edgeId => {
      const edge = cy.getElementById(edgeId);
      if (edge.length > 0) {
        edge.removeClass('hidden-element');
      }
    });
    
    // If at max timestamp but no elements are visible, or very few elements are visible, show all
    const visibleElementCount = cy.elements(':visible').length;
    const totalElementCount = cy.elements().length;
    
    if (currentTimestamp >= maxTimestamp && visibleElementCount < totalElementCount * 0.5) {
      cy.elements().removeClass('hidden-element');
    }
    
    // Run layout on visible elements only if animating
    if (isAnimating) {
      const visibleElements = cy.elements(':visible');
      if (visibleElements.length > 0) {
        visibleElements.layout({
          name: 'fcose',
          animate: true,
          animationDuration: Math.min(animationSpeed * 0.8, 800), // Adjust based on animation speed
          animationEasing: 'ease-out',
          fit: false,
          padding: 50,
          nodeRepulsion: 8000,
          idealEdgeLength: 150,
          randomize: false,
          gravity: 0.25,
          gravityRange: 3.8,
          numIter: 500 // Reduce iterations for faster layout
        } as any).run();
      }
    }
  };

  // Update visibility when timestamp changes
  useEffect(() => {
    updateGraphVisibility();
  }, [currentTimestamp, isGraphInitialized]);

  // Animation control functions
  const startAnimation = () => {
    if (notes.length === 0) return;
    
    setIsAnimating(true);
    
    // Sort notes by timestamp
    const sortedNotes = [...notes].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const noteTimestamps = sortedNotes.map(note => note.timestamp || 0);
    
    // Start from the first note
    setCurrentTimestamp(noteTimestamps[0]);
    
    // Calculate 10% of total notes
    const notesPerStep = Math.max(1, Math.floor(notes.length * 0.1));
    let currentIndex = 0;
    
    animationIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        stopAnimation();
        return;
      }
      
      currentIndex += notesPerStep;
      
      if (currentIndex >= noteTimestamps.length - 1) {
        // Show all notes at the end
        setCurrentTimestamp(maxTimestamp);
        stopAnimation();
        // Ensure all elements are visible after animation completes
        setTimeout(() => {
          if (cyRef.current && isGraphInitialized && isMountedRef.current) {
            cyRef.current.elements().removeClass('hidden-element');
          }
        }, 100);
      } else {
        // Set timestamp to include notes up to current index
        const timestamp = noteTimestamps[Math.min(currentIndex, noteTimestamps.length - 1)];
        setCurrentTimestamp(timestamp);
      }
    }, animationSpeed);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
  };

  const resetAnimation = () => {
    stopAnimation();
    setCurrentTimestamp(maxTimestamp);
    // Force update visibility after reset
    setTimeout(() => {
      if (cyRef.current && isGraphInitialized && isMountedRef.current) {
        cyRef.current.elements().removeClass('hidden-element');
      }
    }, 100);
  };

  // Track component mount state and cleanup animation on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  // Handle page visibility changes and tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden (tab switched)
        console.log('[SocialGraph] Page hidden, pausing animation');
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
        }
      } else {
        // Page is visible again
        console.log('[SocialGraph] Page visible again');
        if (cyRef.current && isGraphInitialized) {
          // Ensure all elements are visible if at max timestamp
          if (currentTimestamp !== null && currentTimestamp >= maxTimestamp) {
            cyRef.current.elements().removeClass('hidden-element');
          } else {
            updateGraphVisibility();
          }
        }
      }
    };

    // Listen for tab changes within the app
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail === 'notes') {
        // Switching away from analysis tab
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('app:activeTab', handleTabChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('app:activeTab', handleTabChange);
    };
  }, [currentTimestamp, maxTimestamp, isGraphInitialized]);

  // Create graph only once with all elements
  useEffect(() => {
    if (!containerRef.current || notes.length === 0) {
      setLoading(false);
      return;
    }

    // Don't recreate if already initialized and container is valid
    if (isGraphInitialized && cyRef.current && cyRef.current.container()) {
      console.log('[SocialGraph] Graph already initialized with valid container, skipping recreation');
      return;
    }

    // Destroy previous instance if it exists
    if (cyRef.current) {
      try {
        if (cyRef.current.container()) {
          cyRef.current.destroy();
        }
      } catch (e) {
        console.error('[SocialGraph] Error destroying previous instance:', e);
      }
      cyRef.current = null;
      setIsGraphInitialized(false);
    }

    const createGraph = async () => {
      console.log('[SocialGraph] Starting to create graph');
      console.log(`[SocialGraph] Processing ${notes.length} notes, ${cmInfos.length} CMs, ${dAppInfos.length} dApps`);
      
      // Process data
      const elements: cytoscape.ElementDefinition[] = [];
      const nodeMap = new Map<string, { type: 'cm' | 'user' | 'dapp'; twitterHandle?: string; label: string; displayName?: string }>();
      const edgeMap = new Map<string, number>();

      // Create a map of all CMs (by normalized Twitter handle) for quick lookup
      const cmHandleMap = new Map<string, { cmName: string; cmTwitterHandle: string }>(); // normalized handle -> cmInfo
      cmInfos.forEach(cmInfo => {
        if (cmInfo.cmTwitterHandle) {
          const normalizedHandle = normalizeHandle(cmInfo.cmTwitterHandle);
          cmHandleMap.set(normalizedHandle, {
            cmName: cmInfo.cmName,
            cmTwitterHandle: normalizedHandle
          });
        }
      });

      // Create a map of all dApps
      const dAppHandleMap = new Map<string, { name: string; twitterHandle: string }>();
      dAppInfos.forEach(dAppInfo => {
        const normalizedHandle = normalizeHandle(dAppInfo.twitterHandle);
        dAppHandleMap.set(normalizedHandle, {
          name: dAppInfo.name,
          twitterHandle: normalizedHandle
        });
      });

      // Track which nodes should be displayed
      const nodesToDisplay = new Set<string>();

      // First pass: identify all nodes from ALL notes
      const notesWithMissingCM: string[] = [];
      notes.forEach(note => {
        // CM/dApp who wrote the note - use cmTwitterHandle from note if available
        if (note.cmTwitterHandle) {
          const normalizedCmHandle = normalizeHandle(note.cmTwitterHandle);
          nodesToDisplay.add(normalizedCmHandle);
        } else {
          // Check if it's a dApp
          const dAppInfo = dAppInfos.find(dApp => dApp.name === note.cmName);
          if (dAppInfo) {
            const normalizedDAppHandle = normalizeHandle(dAppInfo.twitterHandle);
            nodesToDisplay.add(normalizedDAppHandle);
          } else {
            // Fallback: try to find CM by name (for legacy data)
            if (cmNameToHandleMap) {
              if (cmNameToHandleMap.has(note.cmName)) {
                const handle = cmNameToHandleMap.get(note.cmName)!;
                const normalizedCmHandle = normalizeHandle(handle);
                nodesToDisplay.add(normalizedCmHandle);
              } else {
                // Try lowercase version
                if (cmNameToHandleMap.has(note.cmName.toLowerCase())) {
                  const handle = cmNameToHandleMap.get(note.cmName.toLowerCase())!;
                  const normalizedCmHandle = normalizeHandle(handle);
                  nodesToDisplay.add(normalizedCmHandle);
                } else {
                  // Then try cmInfos
                  const cmInfo = cmInfos.find(cm => cm.cmName === note.cmName);
                  if (cmInfo && cmInfo.cmTwitterHandle) {
                    const normalizedCmHandle = normalizeHandle(cmInfo.cmTwitterHandle);
                    nodesToDisplay.add(normalizedCmHandle);
                  } else {
                    notesWithMissingCM.push(`CM: ${note.cmName}, User: @${note.twitterHandle}`);
                  }
                }
              }
            } else {
              // No cmNameToHandleMap available, try cmInfos
              const cmInfo = cmInfos.find(cm => cm.cmName === note.cmName);
              if (cmInfo && cmInfo.cmTwitterHandle) {
                const normalizedCmHandle = normalizeHandle(cmInfo.cmTwitterHandle);
                nodesToDisplay.add(normalizedCmHandle);
              } else {
                notesWithMissingCM.push(`CM: ${note.cmName}, User: @${note.twitterHandle}`);
              }
            }
          }
        }
        
        // User/CM who received the note - they might also be a CM
        const normalizedUserHandle = normalizeHandle(note.twitterHandle);
        nodesToDisplay.add(normalizedUserHandle);
      });
      
      if (notesWithMissingCM.length > 0) {
        console.warn(`[SocialGraph] Notes with missing CM in graph:`, notesWithMissingCM);
      }
      
      console.log(`[SocialGraph] Total nodes to display: ${nodesToDisplay.size}`);

      // Create a set of all CM handles for quick lookup
      const allCmHandles = new Set<string>();
      cmInfos.forEach(cmInfo => {
        if (cmInfo.cmTwitterHandle) {
          allCmHandles.add(normalizeHandle(cmInfo.cmTwitterHandle));
        }
      });

      // Second pass: create nodes
      nodesToDisplay.forEach(normalizedHandle => {
        if (!nodeMap.has(normalizedHandle)) {
          // Check if this is a dApp
          const dAppInfo = dAppHandleMap.get(normalizedHandle);
          if (dAppInfo) {
            nodeMap.set(normalizedHandle, {
              type: 'dapp',
              twitterHandle: normalizedHandle,
              label: `${dAppInfo.name} (dApp)`,
              displayName: dAppInfo.name
            });
            return;
          }
          
          // Check if this handle is a CM
          const cmInfo = cmHandleMap.get(normalizedHandle);
          const isCM = !!cmInfo || allCmHandles.has(normalizedHandle);
          
          let label = `@${normalizedHandle}`;
          let displayName: string | undefined;
          
          if (cmInfo) {
            label = cmInfo.cmName;
            displayName = cmInfo.cmName;
          } else if (isCM) {
            // Find the CM info for this handle
            const foundCm = cmInfos.find(cm => 
              cm.cmTwitterHandle && normalizeHandle(cm.cmTwitterHandle) === normalizedHandle
            );
            if (foundCm) {
              label = foundCm.cmName;
              displayName = foundCm.cmName;
            }
          }
          
          nodeMap.set(normalizedHandle, {
            type: isCM ? 'cm' : 'user',
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
            type: nodeInfo.type,
            twitterHandle: handle,
            image: imageUrl
          },
          classes: `${nodeInfo.type === 'cm' ? 'cm-node' : nodeInfo.type === 'dapp' ? 'dapp-node' : 'user-node'} hidden-element`
        };
      });

      const nodeElements = await Promise.all(nodePromises);
      elements.push(...nodeElements);

      // Process edges from ALL notes
      notes.forEach(note => {
        let cmId: string | undefined;
        
        // Use cmTwitterHandle from note if available
        if (note.cmTwitterHandle) {
          cmId = normalizeHandle(note.cmTwitterHandle);
        } else {
          // Check if it's a dApp
          const dAppInfo = dAppInfos.find(dApp => dApp.name === note.cmName);
          if (dAppInfo) {
            cmId = normalizeHandle(dAppInfo.twitterHandle);
          } else {
            // Fallback: try to find CM by name (for legacy data)
            if (cmNameToHandleMap && cmNameToHandleMap.has(note.cmName)) {
              const handle = cmNameToHandleMap.get(note.cmName)!;
              cmId = normalizeHandle(handle);
            } else {
              const cmInfo = cmInfos.find(cm => cm.cmName === note.cmName);
              if (cmInfo && cmInfo.cmTwitterHandle) {
                cmId = normalizeHandle(cmInfo.cmTwitterHandle);
              }
            }
          }
        }
        
        if (cmId) {
          const userId = normalizeHandle(note.twitterHandle);
          
          if (cmId !== userId) { // Avoid self-loops
            const edgeId = `edge_${cmId}_to_${userId}`;
            edgeMap.set(edgeId, (edgeMap.get(edgeId) || 0) + 1);
          }
        }
      });

      // Create edge elements
      edgeMap.forEach((count, edgeId) => {
        // Parse edge ID: edge_source_to_target
        const match = edgeId.match(/^edge_(.+)_to_(.+)$/);
        if (match) {
          const [, source, target] = match;
          elements.push({
            data: {
              id: edgeId,
              source,
              target,
              weight: count
            },
            classes: 'note-edge hidden-element'
          });
        }
      });

      console.log('[SocialGraph] Creating cytoscape instance with', elements.length, 'elements');

      // Double-check container is still available
      if (!containerRef.current) {
        console.error('[SocialGraph] Container disappeared before creating cytoscape!');
        setLoading(false);
        return;
      }

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
              'shape': 'ellipse',
              'opacity': 1,
              'transition-property': 'opacity',
              'transition-duration': 300,
              'transition-timing-function': 'ease-in-out'
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
            selector: '.dapp-node',
            style: {
              'background-color': '#f3e4ff',
              'border-color': '#9775fa',
              'width': 60,
              'height': 60,
              'font-weight': 'bold',
              'font-size': '14px'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 'mapData(weight, 1, 10, 1, 5)',
              'line-color': '#999999',
              'line-opacity': 0.5,
              'curve-style': 'bezier',
              'target-arrow-shape': 'none',
              'opacity': 1,
              'transition-property': 'opacity',
              'transition-duration': 300,
              'transition-timing-function': 'ease-in-out'
            }
          },
          {
            selector: '.hidden-element',
            style: {
              'opacity': 0,
              'events': 'no'
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
            console.log('[SocialGraph] Initial layout completed');
            setLoading(false);
            setIsGraphInitialized(true);
            // Show all elements after initial layout
            if (cyRef.current) {
              cyRef.current.elements().removeClass('hidden-element');
            }
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

    // Monitor cytoscape instance
    const checkCyInterval = setInterval(() => {
      if (cyRef.current && !cyRef.current.container()) {
        console.error('[SocialGraph] Cytoscape lost its container! Attempting to recover...');
        // Try to recover by forcing visibility update
        if (containerRef.current && currentTimestamp !== null && currentTimestamp >= maxTimestamp) {
          try {
            cyRef.current.mount(containerRef.current);
            cyRef.current.elements().removeClass('hidden-element');
          } catch (e) {
            console.error('[SocialGraph] Failed to recover:', e);
            setIsGraphInitialized(false);
          }
        }
      }
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(checkCyInterval);
      // Only destroy if component is actually unmounting
      if (!isMountedRef.current && cyRef.current) {
        console.log('[SocialGraph] Component unmounting, destroying cytoscape instance');
        try {
          cyRef.current.destroy();
        } catch (e) {
          console.error('[SocialGraph] Error during cleanup:', e);
        }
        cyRef.current = null;
        setIsGraphInitialized(false);
      }
    };
  }, []); // Create only once when component mounts

  // Update graph when data changes
  useEffect(() => {
    if (cyRef.current && isGraphInitialized && notes.length > 0) {
      // Instead of recreating, just update visibility
      updateGraphVisibility();
    }
  }, [notes.length, isGraphInitialized]);

  // Format timestamp to date string
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="social-graph">
      <h2 className="section-title">Social Network</h2>
      
      {/* Timeline Controls */}
      <div className="timeline-controls">
        <div className="timeline-header">
          <div className="timeline-buttons">
            <button 
              className="timeline-button"
              onClick={startAnimation}
              disabled={isAnimating || minTimestamp === 0}
            >
              {isAnimating ? '⏸ Pause' : '▶ Play Timeline'}
            </button>
            <button 
              className="timeline-button secondary"
              onClick={resetAnimation}
              disabled={isAnimating}
            >
              ⏹ Reset
            </button>
          </div>
          <div className="speed-control">
            <label>Speed:</label>
            <select 
              className="speed-select"
              value={animationSpeed} 
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              disabled={isAnimating}
            >
              <option value={3000}>0.3x</option>
              <option value={2000}>0.5x</option>
              <option value={1000}>1x</option>
              <option value={500}>2x</option>
              <option value={250}>4x</option>
              <option value={100}>10x</option>
            </select>
          </div>
        </div>
        
        <div className="timeline-progress">
          <div className="timeline-slider">
            <div className="slider-track">
              <div 
                className="slider-fill" 
                style={{ 
                  width: currentTimestamp && maxTimestamp > minTimestamp
                    ? `${((currentTimestamp - minTimestamp) / (maxTimestamp - minTimestamp)) * 100}%`
                    : '100%'
                }}
              />
              <input
                type="range"
                className="slider-input"
                min={minTimestamp || 0}
                max={maxTimestamp || 0}
                value={currentTimestamp || maxTimestamp}
                onChange={(e) => {
                  stopAnimation();
                  setCurrentTimestamp(Number(e.target.value));
                }}
                disabled={minTimestamp === 0}
              />
            </div>
            <div className="timeline-dates">
              <span>{minTimestamp ? formatDate(minTimestamp) : '-'}</span>
              <span className="current-date">
                {currentTimestamp ? `${formatDate(currentTimestamp)} (${notes.filter(n => (n.timestamp || 0) <= currentTimestamp).length}/${notes.length} notes)` : '-'}
              </span>
              <span>{maxTimestamp ? formatDate(maxTimestamp) : '-'}</span>
            </div>
          </div>
        </div>
      </div>
      
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
          {dAppInfos.length > 0 && (
            <div className="legend-item">
              <span className="legend-dot dapp-dot"></span>
              <span>dApp</span>
            </div>
          )}
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