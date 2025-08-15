import { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Note } from '../types';
import { ProfileImageCacheService } from '../services/profileImageCache';
import './GrowthTimeline.css';

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

interface GrowthTimelineProps {
  notes: Note[];
  cmInfos: CMInfo[];
}

interface DataPoint {
  date: string;
  total: number;
  [cmName: string]: number | string;
}

function GrowthTimeline({ notes, cmInfos }: GrowthTimelineProps) {
  const [userProfileImages, setUserProfileImages] = useState<Map<string, string>>(new Map());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const { chartData, topUsers } = useMemo(() => {
    if (!notes.length) return { chartData: [], topUsers: [] };

    // Helper function to normalize handles
    const normalizeHandle = (handle: string): string => {
      return (handle.startsWith('@') ? handle.substring(1) : handle).toLowerCase();
    };

    // Sort all notes by timestamp
    const sortedNotes = [...notes].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    // Group notes by recipient (user who received notes) - normalized
    const userNotesMap = new Map<string, Note[]>();
    notes.forEach(note => {
      const normalizedHandle = normalizeHandle(note.twitterHandle);
      const userNotes = userNotesMap.get(normalizedHandle) || [];
      userNotes.push(note);
      userNotesMap.set(normalizedHandle, userNotes);
    });
    
    // Get all users sorted by total notes received
    const userNoteCounts = Array.from(userNotesMap.entries())
      .map(([handle, userNotes]) => ({ handle, count: userNotes.length }))
      .sort((a, b) => b.count - a.count);
    
    const allUserHandles = userNoteCounts.map(u => u.handle);
    
    // Get date range
    const startDate = new Date((sortedNotes[0].timestamp || 0) * 1000);
    // Use current date as end date if it's more recent than the last note
    const lastNoteDate = new Date((sortedNotes[sortedNotes.length - 1].timestamp || 0) * 1000);
    const today = new Date();
    const endDate = today > lastNoteDate ? today : lastNoteDate;
    
    // Create weekly or monthly data points based on date range
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const useMonthly = daysDiff > 180;
    const useWeekly = daysDiff > 60 && !useMonthly;
    
    const dataMap = new Map<string, DataPoint>();
    
    // Initialize data structure
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    
    if (useMonthly) {
      currentDate.setDate(1);
    } else if (useWeekly) {
      currentDate.setDate(currentDate.getDate() - currentDate.getDay());
    }
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dataPoint: DataPoint = {
        date: dateStr,
        total: 0
      };
      
      // Track all users
      allUserHandles.forEach(handle => {
        dataPoint[handle] = 0;
      });
      
      dataMap.set(dateStr, dataPoint);
      
      if (useMonthly) {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (useWeekly) {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Count cumulative notes - both total and per user
    const cumulativeCounts: { [key: string]: number } = { total: 0 };
    const totalCumulative = { total: 0 };
    allUserHandles.forEach(handle => {
      cumulativeCounts[handle] = 0;
    });
    
    // Process ALL notes to get accurate total count
    sortedNotes.forEach(note => {
      const noteDate = new Date(note.timestamp * 1000);
      let dateStr: string;
      
      if (useMonthly) {
        dateStr = new Date(noteDate.getFullYear(), noteDate.getMonth(), 1).toISOString().split('T')[0];
      } else if (useWeekly) {
        const weekStart = new Date(noteDate);
        weekStart.setDate(noteDate.getDate() - noteDate.getDay());
        dateStr = weekStart.toISOString().split('T')[0];
      } else {
        dateStr = noteDate.toISOString().split('T')[0];
      }
      
      // Always update total count
      totalCumulative.total++;
      
      // Update user-specific count
      const normalizedNoteHandle = normalizeHandle(note.twitterHandle);
      if (allUserHandles.includes(normalizedNoteHandle)) {
        cumulativeCounts[normalizedNoteHandle]++;
      }
      
      // Update all future dates with cumulative count
      dataMap.forEach((dataPoint, date) => {
        if (date >= dateStr) {
          dataPoint.total = totalCumulative.total;
          if (allUserHandles.includes(normalizedNoteHandle)) {
            dataPoint[normalizedNoteHandle] = cumulativeCounts[normalizedNoteHandle];
          }
        }
      });
    });
    
    // Convert map to array and format dates
    const data = Array.from(dataMap.values()).map(point => ({
      ...point,
      date: new Date(point.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: useMonthly ? undefined : 'numeric',
        year: useMonthly ? '2-digit' : undefined
      })
    }));
    
    // Return only every nth point if still too many
    if (data.length > 50) {
      const step = Math.ceil(data.length / 50);
      const filteredData = data.filter((_, index) => index % step === 0);
      
      // Always include the last data point if it's not already included
      const lastDataPoint = data[data.length - 1];
      if (filteredData[filteredData.length - 1] !== lastDataPoint) {
        filteredData.push(lastDataPoint);
      }
      
      return { 
        chartData: filteredData,
        topUsers: userNoteCounts.slice(0, 50)
      };
    }
    
    return { 
      chartData: data, 
      topUsers: userNoteCounts.slice(0, 50)
    };
  }, [notes, cmInfos]);

  // Initialize default selection to top 10 on first data load
  useEffect(() => {
    if (selectedUsers.length === 0 && topUsers.length > 0) {
      setSelectedUsers(topUsers.slice(0, 10).map(u => u.handle));
    }
  }, [topUsers]);

  // Load profile images for selected users
  useEffect(() => {
    const loadImages = async () => {
      const imageMap = new Map<string, string>();
      for (const handle of selectedUsers) {
        try {
          const imageUrl = await ProfileImageCacheService.loadProfileImage(handle);
          imageMap.set(handle, imageUrl);
        } catch (error) {
          console.error(`Failed to load profile image for ${handle}:`, error);
        }
      }
      setUserProfileImages(imageMap);
    };
    if (selectedUsers.length > 0) {
      loadImages();
    }
  }, [selectedUsers]);

  // Search suggestions based on search term
  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return topUsers
      .filter(({ handle }) => 
        !selectedUsers.includes(handle) &&
        handle.toLowerCase().includes(searchLower)
      )
      .slice(0, 5);
  }, [searchTerm, selectedUsers, topUsers]);

  const handleAddUser = (handle: string) => {
    if (!selectedUsers.includes(handle)) {
      setSelectedUsers(prev => [...prev, handle]);
    }
    setSearchTerm('');
  };

  const handleRemoveUser = (handle: string) => {
    setSelectedUsers(prev => prev.filter(h => h !== handle));
  };

  // Generate colors for users
  const userColors = useMemo(() => {
    const colorMap: { [key: string]: string } = {};
    const totalUsers = selectedUsers.length;
    
    selectedUsers.forEach((handle, index) => {
      // Use HSL to generate distinct colors for all users
      const hue = (index * 360) / totalUsers;
      const saturation = 65 + (index % 3) * 10; // Vary saturation between 65-85%
      const lightness = 45 + (index % 2) * 10; // Vary lightness between 45-55%
      colorMap[handle] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
    
    return colorMap;
  }, [selectedUsers]);

  if (!chartData.length) {
    return (
      <div className="growth-timeline">
        <h2 className="section-title">Note Growth Timeline</h2>
        <div className="empty-state">
          <p>No data available for timeline</p>
        </div>
      </div>
    );
  }

  // Memoized chart element to prevent rerender on typing in search
  const chartElement = useMemo(() => {
    // Custom dot component for profile images (scoped to memo)
    const CustomDot = (props: any) => {
      const { cx, cy, payload, dataKey } = props;
      const isLastPoint = payload === chartData[chartData.length - 1];
      if (!isLastPoint || dataKey === 'total') return null;
      if (!selectedUsers.includes(dataKey)) return null;
      const imageUrl = userProfileImages.get(dataKey);
      if (!imageUrl) return null;
      return (
        <g>
          <defs>
            <clipPath id={`clip-${dataKey}`}>
              <circle cx={cx} cy={cy} r="15" />
            </clipPath>
          </defs>
          <circle 
            cx={cx} 
            cy={cy} 
            r="17" 
            fill={userColors[dataKey]}
            stroke="white"
            strokeWidth="2"
          />
          <image
            x={cx - 15}
            y={cy - 15}
            width="30"
            height="30"
            href={imageUrl}
            clipPath={`url(#clip-${dataKey})`}
          />
        </g>
      );
    };

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--text-secondary)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="var(--text-secondary)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--surface)', 
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)'
              }}
              formatter={(value: any, name: string) => {
                if (name === 'Total Notes') return [`${value} (All users)`, name];
                return [value, name];
              }}
              itemSorter={(item: any) => {
                // Sort by value in descending order (highest first)
                if (item.dataKey === 'total') return -999999; // Keep total first
                return -item.value;
              }}
            />
            
            <Line
              type="monotone"
              dataKey="total"
              stroke="#999"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Total Notes"
              dot={false}
            />
            
            {selectedUsers.map(handle => (
              <Line
                key={handle}
                type="monotone"
                dataKey={handle}
                stroke={userColors[handle]}
                strokeWidth={2.5}
                name={`@${handle}`}
                dot={<CustomDot />}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }, [chartData, selectedUsers, userColors, userProfileImages, notes.length]);

  return (
    <div className="growth-timeline">
      <h2 className="section-title">Cumulative Numbers</h2>

      <div className="timeline-toolbar">
        <div className="timeline-editor always-visible">
          <div className="selected-users" aria-label="Selected users">
            {selectedUsers.map(handle => (
              <div key={handle} className="user-chip">
                <span className="chip-handle">@{handle}</span>
                <button className="chip-remove" onClick={() => handleRemoveUser(handle)} aria-label={`remove @${handle}`}>×</button>
              </div>
            ))}
          </div>
          <div className="user-search">
            <input
              type="text"
              className="user-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users to add..."
            />
            {searchSuggestions.length > 0 && (
              <div className="user-suggestions">
                {searchSuggestions.map(({ handle, count }) => (
                  <button key={handle} className="suggestion-item" onClick={() => handleAddUser(handle)}>
                    @{handle} ({count} notes)
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {chartElement}
      
      <div className="chart-info">
        <p>
          Showing {selectedUsers.length} of {topUsers.length} users (Total notes: {notes.length})
        </p>
      </div>
    </div>
  );
}

export default GrowthTimeline; 