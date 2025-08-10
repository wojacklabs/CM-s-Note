import { useState, useEffect, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Note } from '../types';
import { IrysRankingService, RankingData } from '../services/irysRankingService';
import { ProfileImageCacheService } from '../services/profileImageCache';
import './RankingCorrelation.css';

interface RankingCorrelationProps {
  notes: Note[];
}

interface CorrelationPoint {
  twitterHandle: string;
  rank: number;
  notesReceived: number;
  profileImage?: string;
}

function RankingCorrelation({ notes }: RankingCorrelationProps) {
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImages, setProfileImages] = useState<Map<string, string>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load rankings and set up auto-refresh
  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[RankingCorrelation] Loading Irys ranking data...');
        
        // Clear cache on first load to ensure fresh data
        IrysRankingService.clearCache();
        
        const data = await IrysRankingService.fetchRankingData();
        console.log('[RankingCorrelation] Loaded rankings:', data.length, 'entries');
        console.log('[RankingCorrelation] Sample rankings:', data.slice(0, 5));
        setRankings(data);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('[RankingCorrelation] Failed to load rankings:', err);
        setError('Failed to load ranking data. Will retry in 30 minutes.');
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadRankings();

    // Set up refresh interval (30 minutes)
    const interval = setInterval(loadRankings, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate correlation data
  const correlationData = useMemo(() => {
    console.log('[RankingCorrelation] Rankings:', rankings.length, 'Notes:', notes.length);
    
    if (!rankings.length || !notes.length) return [];

    // Helper function to normalize handles
    const normalizeHandle = (handle: string): string => {
      return (handle.startsWith('@') ? handle.substring(1) : handle).toLowerCase();
    };

    // Count notes received by each user (normalized)
    const notesReceivedMap = new Map<string, number>();
    notes.forEach(note => {
      const normalizedHandle = normalizeHandle(note.twitterHandle);
      const count = notesReceivedMap.get(normalizedHandle) || 0;
      notesReceivedMap.set(normalizedHandle, count + 1);
    });

    console.log('[RankingCorrelation] Notes received map size:', notesReceivedMap.size);
    console.log('[RankingCorrelation] Sample note handles:', Array.from(notesReceivedMap.keys()).slice(0, 5));
    console.log('[RankingCorrelation] Sample ranking addresses:', rankings.slice(0, 5).map(r => r.address));

    // Create correlation points
    const points: CorrelationPoint[] = [];
    
    rankings.forEach(ranking => {
      // Normalize the ranking address
      const normalizedRankingHandle = normalizeHandle(ranking.address);
      const notesReceived = notesReceivedMap.get(normalizedRankingHandle);
      
      if (notesReceived !== undefined) {
        console.log(`[RankingCorrelation] Match found: ${normalizedRankingHandle} (rank: ${ranking.rank}, notes: ${notesReceived})`);
        points.push({
          twitterHandle: normalizedRankingHandle,
          rank: ranking.rank,
          notesReceived
        });
      }
    });

    console.log('[RankingCorrelation] Total correlation points:', points.length);
    return points;
  }, [rankings, notes]);

  // Load profile images for correlation points
  useEffect(() => {
    const loadImages = async () => {
      const imageMap = new Map<string, string>();
      console.log('[RankingCorrelation] Loading profile images for', correlationData.length, 'users');
      
      // First, check for cached images
      for (const point of correlationData) {
        // Try with the normalized handle
        const cachedUrl = ProfileImageCacheService.getCachedImage(point.twitterHandle);
        if (cachedUrl) {
          imageMap.set(point.twitterHandle, cachedUrl);
        }
      }
      
      console.log('[RankingCorrelation] Found', imageMap.size, 'cached images');
      
      // Load missing images
      const missingHandles = correlationData
        .filter(point => !imageMap.has(point.twitterHandle))
        .map(point => point.twitterHandle);
      
      if (missingHandles.length > 0) {
        console.log('[RankingCorrelation] Loading', missingHandles.length, 'missing images');
        
        for (const handle of missingHandles) {
          try {
            const imageUrl = await ProfileImageCacheService.loadProfileImage(handle);
            imageMap.set(handle, imageUrl);
          } catch (error) {
            console.error(`Failed to load profile image for ${handle}:`, error);
          }
        }
      }
      
      setProfileImages(imageMap);
    };

    if (correlationData.length > 0) {
      loadImages();
    }
  }, [correlationData]);

  // Calculate correlation statistics
  const stats = useMemo(() => {
    if (correlationData.length < 2) return null;

    const n = correlationData.length;
    const sumX = correlationData.reduce((sum, p) => sum + p.rank, 0);
    const sumY = correlationData.reduce((sum, p) => sum + p.notesReceived, 0);
    const sumXY = correlationData.reduce((sum, p) => sum + p.rank * p.notesReceived, 0);
    const sumX2 = correlationData.reduce((sum, p) => sum + p.rank * p.rank, 0);
    const sumY2 = correlationData.reduce((sum, p) => sum + p.notesReceived * p.notesReceived, 0);

    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    // Calculate trend line
    const meanX = sumX / n;
    const meanY = sumY / n;
    const slope = (sumXY - n * meanX * meanY) / (sumX2 - n * meanX * meanX);
    const intercept = meanY - slope * meanX;

    return {
      correlation: isNaN(correlation) ? 0 : correlation,
      slope,
      intercept,
      meanRank: meanX,
      meanNotes: meanY
    };
  }, [correlationData]);

  // Custom dot component with profile images
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const imageUrl = profileImages.get(payload.twitterHandle) || 
                    ProfileImageCacheService.getCachedImage(payload.twitterHandle);
    
    const idSafe = String(payload.twitterHandle).replace(/[^a-zA-Z0-9_-]/g, '');
    const clipId = `clip-${idSafe}-${Math.round(cx)}-${Math.round(cy)}`;

    if (!imageUrl) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r="8" 
          fill="#4dabf7"
          stroke="white"
          strokeWidth="2"
        />
      );
    }

    return (
      <g>
        <defs>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r="16" />
          </clipPath>
        </defs>
        <circle 
          cx={cx} 
          cy={cy} 
          r="18" 
          fill="#4dabf7"
          stroke="white"
          strokeWidth="2"
        />
        <image
          x={cx - 16}
          y={cy - 16}
          width="32"
          height="32"
          href={imageUrl}
          clipPath={`url(#${clipId})`}
          style={{ cursor: 'pointer' }}
        />
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="correlation-tooltip">
          <p className="tooltip-handle">{data.twitterHandle}</p>
          <p>Rank: #{data.rank}</p>
          <p>Notes Received: {data.notesReceived}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="ranking-correlation">
        <h2 className="section-title">InfoFi Correlation</h2>
        <div className="chart-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading ranking data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-correlation">
        <h2 className="section-title">InfoFi Correlation</h2>
        <div className="chart-container">
          <div className="error-state">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!correlationData.length) {
    return (
      <div className="ranking-correlation">
        <h2 className="section-title">InfoFi Correlation</h2>
        <div className="empty-state">
          <p>No correlation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ranking-correlation">
      <h2 className="section-title">InfoFi Correlation</h2>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              type="number"
              dataKey="rank" 
              name="Irys Rank"
              label={{ value: 'Irys Project Rank', position: 'insideBottom', offset: -10 }}
              domain={['dataMin - 10', 'dataMax + 10']}
              reversed={true}
              stroke="var(--text-secondary)"
              scale="linear"
            />
            <YAxis 
              type="number"
              dataKey="notesReceived"
              name="Notes Received"
              label={{ value: 'Notes Received', angle: -90, position: 'insideLeft' }}
              domain={[0, 'dataMax + 5']}
              stroke="var(--text-secondary)"
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3' }}
            />
            
            {/* Reference line for trend */}
            {stats && correlationData.length > 0 && (
              <ReferenceLine
                segment={[
                  { 
                    x: Math.min(...correlationData.map(d => d.rank)), 
                    y: stats.intercept + stats.slope * Math.min(...correlationData.map(d => d.rank)) 
                  },
                  { 
                    x: Math.max(...correlationData.map(d => d.rank)), 
                    y: stats.intercept + stats.slope * Math.max(...correlationData.map(d => d.rank)) 
                  }
                ]}
                stroke="#ff6b6b"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: "Trend Line", position: "top" }}
              />
            )}
            
            <Scatter
              name="Users"
              data={correlationData}
              shape={<CustomDot />}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="correlation-info">
        <div className="stats-grid">
          {stats && (
            <>
              <div className="stat-item">
                <h4>Correlation Coefficient</h4>
                <p className={`correlation-value ${stats.correlation < -0.5 ? 'strong' : stats.correlation < -0.3 ? 'moderate' : 'weak'}`}>
                  {stats.correlation.toFixed(3)}
                </p>
                <span className="stat-label">
                  {stats.correlation < -0.7 ? 'Strong Negative' : 
                   stats.correlation < -0.3 ? 'Moderate Negative' : 
                   stats.correlation < 0 ? 'Weak Negative' :
                   stats.correlation < 0.3 ? 'Weak Positive' :
                   stats.correlation < 0.7 ? 'Moderate Positive' : 'Strong Positive'}
                </span>
              </div>
              <div className="stat-item">
                <h4>Data Points</h4>
                <p>{correlationData.length}</p>
                <span className="stat-label">Users with both rank & notes</span>
              </div>
              <div className="stat-item">
                <h4>Average Rank</h4>
                <p>{Math.round(stats.meanRank)}</p>
                <span className="stat-label">Mean ranking position</span>
              </div>
              <div className="stat-item">
                <h4>Average Notes</h4>
                <p>{Math.round(stats.meanNotes)}</p>
                <span className="stat-label">Mean notes received</span>
              </div>
            </>
          )}
        </div>
        
        <div className="update-info">
          <p>Last updated: {lastUpdate.toLocaleTimeString()} • Updates every 30 minutes</p>
        </div>
      </div>
    </div>
  );
}

export default RankingCorrelation; 