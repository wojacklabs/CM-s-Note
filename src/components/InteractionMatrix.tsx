import { useMemo } from 'react';
import { Note } from '../types';
import './InteractionMatrix.css';

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

interface InteractionMatrixProps {
  notes: Note[];
  cmInfos: CMInfo[];
}

interface MatrixCell {
  cmName: string;
  userHandle: string;
  count: number;
  intensity: number; // 0-1 scale for color intensity
}

function InteractionMatrix({ notes, cmInfos }: InteractionMatrixProps) {
  const { matrixData, users, cms, maxCount, viewMode } = useMemo(() => {
    // Create interaction map
    const interactionMap = new Map<string, number>();
    const userSet = new Set<string>();
    const cmNoteCounts = new Map<string, number>();
    
    notes.forEach(note => {
      const key = `${note.cmName}|||${note.twitterHandle}`;
      interactionMap.set(key, (interactionMap.get(key) || 0) + 1);
      userSet.add(note.twitterHandle);
      cmNoteCounts.set(note.cmName, (cmNoteCounts.get(note.cmName) || 0) + 1);
    });
    
    // Get top users by total notes
    const userNoteCounts = new Map<string, number>();
    notes.forEach(note => {
      userNoteCounts.set(note.twitterHandle, (userNoteCounts.get(note.twitterHandle) || 0) + 1);
    });
    
    // Determine view mode based on data size
    const totalUsers = userSet.size;
    const totalCMs = cmInfos.length;
    let mode: 'full' | 'summary' | 'heatmap' = 'full';
    let displayUsers: string[] = [];
    let displayCMs: CMInfo[] = [];
    
    if (totalUsers > 100 || totalCMs > 20) {
      mode = 'heatmap';
      // Show aggregated view
      displayUsers = [];
      displayCMs = [];
    } else if (totalUsers > 30 || totalCMs > 10) {
      mode = 'summary';
      // Show top 20 users and top 10 CMs
      displayUsers = Array.from(userNoteCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([handle]) => handle);
      
      const topCMNames = Array.from(cmNoteCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name);
      
      displayCMs = cmInfos.filter(cm => topCMNames.includes(cm.cmName));
    } else {
      // Show all
      displayUsers = Array.from(userNoteCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([handle]) => handle);
      displayCMs = cmInfos;
    }
    
    // Build matrix data
    const matrix: MatrixCell[] = [];
    let max = 0;
    
    if (mode !== 'heatmap') {
      displayCMs.forEach(cm => {
        displayUsers.forEach(userHandle => {
          const count = interactionMap.get(`${cm.cmName}|||${userHandle}`) || 0;
          max = Math.max(max, count);
          matrix.push({
            cmName: cm.cmName,
            userHandle,
            count,
            intensity: 0
          });
        });
      });
      
      // Calculate intensity
      matrix.forEach(cell => {
        cell.intensity = max > 0 ? cell.count / max : 0;
      });
    }
    
    return {
      matrixData: matrix,
      users: displayUsers,
      cms: displayCMs,
      maxCount: max,
      viewMode: mode,
      totalUsers,
      totalCMs
    };
  }, [notes, cmInfos]);

  const getCellColor = (intensity: number) => {
    if (intensity === 0) return 'var(--background)';
    
    // Use a color scale from light to dark
    const hue = 210; // Blue hue
    const saturation = 70;
    const lightness = 95 - (intensity * 50); // From 95% to 45%
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

    if ((!matrixData.length && viewMode !== 'heatmap') || !cmInfos.length || notes.length === 0) {
    return (
      <div className="interaction-matrix">
        <h2 className="section-title">CM-User Interaction Matrix</h2>
        <div className="empty-state">
          <p>No interaction data available</p>
        </div>
      </div>
    );
  }

  // Heatmap view for large datasets
  if (viewMode === 'heatmap') {
    const heatmapData = useMemo(() => {
      // Create buckets for users and CMs
      const userBuckets = 10;
      const cmBuckets = 8;
      
      // Sort users and CMs by activity
      const sortedUsersByActivity = Array.from(new Set(notes.map(n => n.twitterHandle)))
        .map(handle => ({
          handle,
          count: notes.filter(n => n.twitterHandle === handle).length
        }))
        .sort((a, b) => b.count - a.count);
      
      const sortedCMsByActivity = cmInfos
        .map(cm => ({
          name: cm.cmName,
          count: notes.filter(n => n.cmName === cm.cmName).length
        }))
        .sort((a, b) => b.count - a.count);
      
      // Create heatmap grid
      const grid: number[][] = Array(cmBuckets).fill(0).map(() => Array(userBuckets).fill(0));
      const userBucketSize = Math.ceil(sortedUsersByActivity.length / userBuckets);
      const cmBucketSize = Math.ceil(sortedCMsByActivity.length / cmBuckets);
      
      notes.forEach(note => {
        const userIndex = sortedUsersByActivity.findIndex(u => u.handle === note.twitterHandle);
        const cmIndex = sortedCMsByActivity.findIndex(c => c.name === note.cmName);
        
        if (userIndex !== -1 && cmIndex !== -1) {
          const userBucket = Math.min(Math.floor(userIndex / userBucketSize), userBuckets - 1);
          const cmBucket = Math.min(Math.floor(cmIndex / cmBucketSize), cmBuckets - 1);
          grid[cmBucket][userBucket]++;
        }
      });
      
      // Find max for intensity calculation
      const maxValue = Math.max(...grid.flat());
      
      return { grid, maxValue, userBucketSize, cmBucketSize };
    }, [notes, cmInfos]);
    
    return (
      <div className="interaction-matrix">
        <h2 className="section-title">CM-User Interaction Heatmap</h2>
        <div className="matrix-container">
          <div className="heatmap-container">
            <div className="heatmap-grid">
              {heatmapData.grid.map((row, i) => (
                <div key={i} className="heatmap-row">
                  {row.map((value, j) => (
                    <div
                      key={j}
                      className="heatmap-cell"
                      style={{
                        backgroundColor: getCellColor(value / heatmapData.maxValue),
                        opacity: value > 0 ? 1 : 0.1
                      }}
                      title={`CM Group ${i + 1} → User Group ${j + 1}: ${value} notes`}
                    >
                      {value > 0 && value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="heatmap-labels">
              <div className="heatmap-ylabel">More Active CMs ↑</div>
              <div className="heatmap-xlabel">More Active Users →</div>
            </div>
          </div>
          
          <div className="matrix-legend">
            <span className="legend-label">Interaction Density:</span>
            <div className="legend-gradient">
              <span>Low</span>
              <div className="gradient-bar"></div>
              <span>High</span>
            </div>
          </div>
        </div>
        
        <div className="matrix-info">
          <p>Aggregated view of {cmInfos.length} CMs and {new Set(notes.map(n => n.twitterHandle)).size} users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="interaction-matrix">
      <h2 className="section-title">CM-User Interaction Matrix</h2>
      <div className="matrix-container">
        <div className="matrix-scroll">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="corner-cell"></th>
                {users.map(user => (
                  <th key={user} className="matrix-user-header">
                    <div className="header-text">@{user}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cms.map(cm => (
                <tr key={cm.cmName}>
                  <td className="matrix-cm-header">{cm.cmName}</td>
                  {users.map(user => {
                    const cell = matrixData.find(
                      c => c.cmName === cm.cmName && c.userHandle === user
                    );
                    return (
                      <td
                        key={`${cm.cmName}-${user}`}
                        className="matrix-cell"
                        style={{ backgroundColor: getCellColor(cell?.intensity || 0) }}
                        title={`${cm.cmName} → @${user}: ${cell?.count || 0} notes`}
                      >
                        {cell?.count || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="matrix-legend">
          <span className="legend-label">Note Count:</span>
          <div className="legend-gradient">
            <span>0</span>
            <div className="gradient-bar"></div>
            <span>{maxCount}</span>
          </div>
        </div>
      </div>
      
      <div className="matrix-info">
        <p>
          {viewMode === 'summary' 
            ? `Showing top ${cms.length} CMs and top ${users.length} users`
            : `Showing all ${cms.length} CMs and ${users.length} users`}
        </p>
      </div>
    </div>
  );
}

export default InteractionMatrix; 