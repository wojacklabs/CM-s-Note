/**
 * Centralized CM Data Management Service
 * Handles all CM Twitter handle and nickname mappings
 */

interface CMMapping {
  currentName: string;
  twitterHandle: string;
  allNames: Set<string>; // All nicknames this CM has used
  isDApp?: boolean;
}

export class CMDataService {
  private static instance: CMDataService;
  private cmMappings: Map<string, CMMapping> = new Map(); // twitterHandle -> CMMapping
  private nameToHandle: Map<string, string> = new Map(); // any CM name -> twitterHandle
  
  private constructor() {}
  
  static getInstance(): CMDataService {
    if (!CMDataService.instance) {
      CMDataService.instance = new CMDataService();
    }
    return CMDataService.instance;
  }
  
  /**
   * Initialize CM mappings from permissions and notes
   */
  initializeMappings(
    cmPermissions: Map<string, string>, // cmName -> twitterHandle
    notes: Array<{ cmName: string; cmTwitterHandle?: string }>,
    dappPresets: string[] = []
  ): void {
    console.log('[CMDataService] Initializing mappings...');
    this.cmMappings.clear();
    this.nameToHandle.clear();
    
    // First, process CM permissions (these are the latest/current mappings)
    cmPermissions.forEach((twitterHandle, cmName) => {
      const normalizedHandle = this.normalizeHandle(twitterHandle);
      const isDApp = dappPresets.includes(normalizedHandle);
      
      this.cmMappings.set(normalizedHandle, {
        currentName: cmName,
        twitterHandle: normalizedHandle,
        allNames: new Set([cmName]),
        isDApp
      });
      
      this.nameToHandle.set(cmName, normalizedHandle);
      console.log(`[CMDataService] Added CM from permissions: ${cmName} -> @${normalizedHandle}${isDApp ? ' (dApp)' : ''}`);
    });
    
    // Second, process all notes to find historical CM names
    notes.forEach(note => {
      if (note.cmTwitterHandle) {
        const normalizedHandle = this.normalizeHandle(note.cmTwitterHandle);
        const mapping = this.cmMappings.get(normalizedHandle);
        
        if (mapping) {
          // This CM exists in our mappings, add any alternate names
          if (note.cmName !== mapping.currentName) {
            mapping.allNames.add(note.cmName);
            this.nameToHandle.set(note.cmName, normalizedHandle);
            console.log(`[CMDataService] Found historical name for @${normalizedHandle}: "${note.cmName}" (current: "${mapping.currentName}")`);
          }
        } else {
          // CM not in permissions but has notes with handle
          const isDApp = dappPresets.includes(normalizedHandle);
          this.cmMappings.set(normalizedHandle, {
            currentName: note.cmName,
            twitterHandle: normalizedHandle,
            allNames: new Set([note.cmName]),
            isDApp
          });
          this.nameToHandle.set(note.cmName, normalizedHandle);
          console.log(`[CMDataService] Added CM from notes: ${note.cmName} -> @${normalizedHandle}${isDApp ? ' (dApp)' : ''}`);
        }
      } else {
        // Note without cmTwitterHandle - try to find handle by name
        const existingHandle = this.nameToHandle.get(note.cmName);
        if (!existingHandle) {
          console.log(`[CMDataService] Warning: No handle found for CM: ${note.cmName}`);
        }
      }
    });
    
    // Log summary
    console.log(`[CMDataService] Initialized ${this.cmMappings.size} CMs with ${this.nameToHandle.size} total name mappings`);
  }
  
  /**
   * Get Twitter handle for any CM name (current or historical)
   */
  getHandleByName(cmName: string): string | undefined {
    return this.nameToHandle.get(cmName);
  }
  
  /**
   * Get current CM name for a Twitter handle
   */
  getCurrentNameByHandle(twitterHandle: string): string | undefined {
    const normalizedHandle = this.normalizeHandle(twitterHandle);
    return this.cmMappings.get(normalizedHandle)?.currentName;
  }
  
  /**
   * Get all names (current and historical) for a Twitter handle
   */
  getAllNamesByHandle(twitterHandle: string): string[] {
    const normalizedHandle = this.normalizeHandle(twitterHandle);
    const mapping = this.cmMappings.get(normalizedHandle);
    return mapping ? Array.from(mapping.allNames) : [];
  }
  
  /**
   * Check if a Twitter handle belongs to a CM
   */
  isCM(twitterHandle: string): boolean {
    const normalizedHandle = this.normalizeHandle(twitterHandle);
    return this.cmMappings.has(normalizedHandle);
  }
  
  /**
   * Check if a Twitter handle belongs to a dApp
   */
  isDApp(twitterHandle: string): boolean {
    const normalizedHandle = this.normalizeHandle(twitterHandle);
    return this.cmMappings.get(normalizedHandle)?.isDApp || false;
  }
  
  /**
   * Get all CM mappings
   */
  getAllMappings(): Map<string, CMMapping> {
    return new Map(this.cmMappings);
  }
  
  /**
   * Enrich notes with CM Twitter handles
   */
  enrichNotes<T extends { cmName: string; cmTwitterHandle?: string }>(notes: T[]): T[] {
    return notes.map(note => {
      if (!note.cmTwitterHandle) {
        const handle = this.getHandleByName(note.cmName);
        if (handle) {
          console.log(`[CMDataService] Enriching note - adding handle for CM "${note.cmName}": @${handle}`);
          return { ...note, cmTwitterHandle: handle };
        }
      }
      return note;
    });
  }
  
  /**
   * Update CM names in notes to use current names
   */
  updateNotesToCurrentNames<T extends { cmName: string; cmTwitterHandle?: string }>(notes: T[]): T[] {
    return notes.map(note => {
      if (note.cmTwitterHandle) {
        const currentName = this.getCurrentNameByHandle(note.cmTwitterHandle);
        if (currentName && currentName !== note.cmName) {
          console.log(`[CMDataService] Updating CM name from "${note.cmName}" to "${currentName}"`);
          return { ...note, cmName: currentName };
        }
      }
      return note;
    });
  }
  
  private normalizeHandle(handle: string): string {
    return (handle.startsWith('@') ? handle.substring(1) : handle).toLowerCase();
  }
}

// Export singleton instance
export const cmDataService = CMDataService.getInstance();
