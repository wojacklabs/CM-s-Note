// Centralized date utility functions based on CM's Note extension

const DEBUG_TIMESTAMPS = false; // Set to true for debugging

// Format timestamp like in CM's Note extension
export function formatTimestamp(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    if (DEBUG_TIMESTAMPS) console.warn('[DateUtils] Invalid timestamp:', timestamp);
    return 'Unknown';
  }

  if (DEBUG_TIMESTAMPS) {
    console.log(`[DateUtils] Original timestamp: ${timestamp}`);
  }
  
  // Handle Unix timestamp (seconds) - CM's Note expects seconds
  const date = new Date(timestamp * 1000);
  
  // Validate date
  if (isNaN(date.getTime())) {
    console.error('[DateUtils] Invalid date created from timestamp:', timestamp);
    return 'Invalid date';
  }
  
  if (DEBUG_TIMESTAMPS) {
    console.log(`[DateUtils] Created date: ${date.toISOString()}`);
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (DEBUG_TIMESTAMPS) {
    console.log(`[DateUtils] Time difference: ${diff}ms (${Math.floor(diff / 1000)}s)`);
  }
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Format for display in status bar
export function formatLastUpdated(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleTimeString();
}

// Debug function to inspect timestamp values (for developer use)
export function debugTimestamp(timestamp: number, source: string): void {
  if (!DEBUG_TIMESTAMPS) return;
  
  console.group(`[DateUtils] Debug timestamp from ${source}`);
  console.log('Raw timestamp:', timestamp);
  console.log('Timestamp type:', typeof timestamp);
  console.log('As seconds -> Date:', new Date(timestamp * 1000).toISOString());
  console.log('As milliseconds -> Date:', new Date(timestamp).toISOString());
  console.log('Current time:', new Date().toISOString());
  console.groupEnd();
}

// Helper function for developers to check timestamps in console
export function inspectTimestamp(timestamp: number): void {
  const asSeconds = new Date(timestamp * 1000);
  const asMilliseconds = new Date(timestamp);
  
  console.group('🕐 Timestamp Inspector');
  console.log('Raw value:', timestamp);
  console.log('If seconds:', asSeconds.toISOString(), '→', formatTimestamp(timestamp));
  console.log('If milliseconds:', asMilliseconds.toISOString(), '→', formatTimestamp(Math.floor(timestamp / 1000)));
  console.log('Current time:', new Date().toISOString());
  console.groupEnd();
}

// Make inspector available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).inspectTimestamp = inspectTimestamp;
} 