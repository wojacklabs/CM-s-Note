const fs = require('fs');
const path = require('path');

// CM's Note Cyberpunk Town Hall Map Generator
console.log('🤖 Generating CM\'s Note Cyberpunk Town Hall Map...\n');

// Map configuration
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const TILE_SIZE = 32;

// Tile indices
const TILES = {
  // Floors
  METAL_GRID: 1,      // Was MARBLE
  NEON_ACCENT: 2,     // Was WOOD  
  INDUSTRIAL_PLATE: 3, // Was CARPET_BLUE
  HOLO_FLOOR: 4,      // Was CARPET_RED
  GRATED_FLOOR: 5,    // Was GRASS
  
  // Walls
  TECH_PANEL: 10,     // Was WALL_BRICK
  HOLO_GLASS: 11,     // Was WALL_GLASS
  INDUSTRIAL_WALL: 12, // Was WALL_WOOD
  
  // Decorations
  CYBER_DESK: 20,     // Was DESK
  HOLO_CHAIR: 21,     // Was CHAIR
  CYBER_COUCH: 22,    // Was SOFA
  HOLO_PLANT: 23,     // Was PLANT
  HOLO_DISPLAY: 24,   // Was WHITEBOARD
  DATA_SERVER: 25,    // Was BOOKSHELF
  CYBER_TERMINAL: 26, // Was COMPUTER
  ENERGY_DISPENSER: 27, // Was COFFEE_MACHINE
  
  // Special
  SPAWN_PORTAL: 50,   // Was SPAWN_POINT
  TELEPORTER_PAD: 51  // Was TELEPORTER
  // Sprite starts at 52
};

// Create map data layers
function createMapData() {
  // Initialize empty map
  const floorLayer = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(TILES.METAL_GRID));
  const wallsLayer = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(0));
  const decorLayer = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(0));
  
  // Design floor patterns
  // Main data hub - metal grid floor
  for (let y = 10; y < 20; y++) {
    for (let x = 15; x < 25; x++) {
      floorLayer[y][x] = TILES.METAL_GRID;
    }
  }
  
  // Cyber meeting rooms - neon accent
  // Top-left meeting room
  for (let y = 2; y < 8; y++) {
    for (let x = 2; x < 10; x++) {
      floorLayer[y][x] = TILES.NEON_ACCENT;
    }
  }
  
  // Top-right meeting room
  for (let y = 2; y < 8; y++) {
    for (let x = 30; x < 38; x++) {
      floorLayer[y][x] = TILES.NEON_ACCENT;
    }
  }
  
  // Bottom-left server room
  for (let y = 22; y < 28; y++) {
    for (let x = 2; x < 10; x++) {
      floorLayer[y][x] = TILES.INDUSTRIAL_PLATE;
    }
  }
  
  // Bottom-right innovation lab
  for (let y = 22; y < 28; y++) {
    for (let x = 30; x < 38; x++) {
      floorLayer[y][x] = TILES.GRATED_FLOOR;
    }
  }
  
  // Tech lounge - holo floor
  for (let y = 10; y < 20; y++) {
    for (let x = 2; x < 12; x++) {
      floorLayer[y][x] = TILES.HOLO_FLOOR;
    }
  }
  
  // Add walls
  // Outer walls - tech panels
  for (let x = 0; x < MAP_WIDTH; x++) {
    wallsLayer[0][x] = TILES.TECH_PANEL;
    wallsLayer[MAP_HEIGHT - 1][x] = TILES.TECH_PANEL;
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    wallsLayer[y][0] = TILES.TECH_PANEL;
    wallsLayer[y][MAP_WIDTH - 1] = TILES.TECH_PANEL;
  }
  
  // Meeting room walls - holographic glass
  // Top-left room
  for (let x = 1; x < 11; x++) {
    wallsLayer[1][x] = TILES.HOLO_GLASS;
    wallsLayer[9][x] = TILES.HOLO_GLASS;
  }
  for (let y = 1; y < 9; y++) {
    wallsLayer[y][1] = TILES.HOLO_GLASS;
    wallsLayer[y][11] = TILES.HOLO_GLASS;
  }
  // Add door opening (energy field)
  wallsLayer[5][11] = 0;
  
  // Top-right room
  for (let x = 29; x < 39; x++) {
    wallsLayer[1][x] = TILES.HOLO_GLASS;
    wallsLayer[9][x] = TILES.HOLO_GLASS;
  }
  for (let y = 1; y < 9; y++) {
    wallsLayer[y][29] = TILES.HOLO_GLASS;
    wallsLayer[y][38] = TILES.HOLO_GLASS;
  }
  // Add door opening (energy field)
  wallsLayer[5][29] = 0;
  
  // Add furniture and decorations
  // Meeting room 1 - conference setup
  decorLayer[4][5] = TILES.CYBER_DESK;
  decorLayer[4][6] = TILES.CYBER_DESK;
  decorLayer[3][5] = TILES.HOLO_CHAIR;
  decorLayer[3][6] = TILES.HOLO_CHAIR;
  decorLayer[5][5] = TILES.HOLO_CHAIR;
  decorLayer[5][6] = TILES.HOLO_CHAIR;
  decorLayer[2][2] = TILES.HOLO_DISPLAY;
  
  // Meeting room 2 - lounge setup
  decorLayer[4][33] = TILES.CYBER_COUCH;
  decorLayer[4][34] = TILES.CYBER_COUCH;
  decorLayer[6][33] = TILES.ENERGY_DISPENSER;
  decorLayer[2][36] = TILES.HOLO_PLANT;
  decorLayer[7][36] = TILES.HOLO_PLANT;
  
  // Cafe area
  for (let i = 0; i < 3; i++) {
    decorLayer[12 + i * 2][4] = TILES.CYBER_DESK;
    decorLayer[12 + i * 2][5] = TILES.HOLO_CHAIR;
    decorLayer[12 + i * 2][6] = TILES.HOLO_CHAIR;
  }
  decorLayer[14][8] = TILES.ENERGY_DISPENSER;
  
  // Library/quiet zone
  for (let i = 0; i < 3; i++) {
    decorLayer[23][3 + i * 2] = TILES.DATA_SERVER;
  }
  decorLayer[25][5] = TILES.CYBER_DESK;
  decorLayer[25][6] = TILES.CYBER_TERMINAL;
  decorLayer[26][5] = TILES.HOLO_CHAIR;
  
  // Creative space - garden theme
  decorLayer[23][32] = TILES.HOLO_PLANT;
  decorLayer[23][35] = TILES.HOLO_PLANT;
  decorLayer[26][32] = TILES.HOLO_PLANT;
  decorLayer[26][35] = TILES.HOLO_PLANT;
  decorLayer[24][33] = TILES.CYBER_COUCH;
  decorLayer[24][34] = TILES.CYBER_COUCH;
  
  // Central hub decorations
  decorLayer[14][19] = TILES.HOLO_PLANT;
  decorLayer[14][20] = TILES.HOLO_PLANT;
  decorLayer[15][19] = TILES.HOLO_PLANT;
  decorLayer[15][20] = TILES.HOLO_PLANT;
  
  // Remove sprite and iryslogo from decoration layer - will use image layers instead
  // (keeping decoration layer for other decorative tiles if needed)
  
  return { floorLayer, wallsLayer, decorLayer };
}

// Convert 2D array to 1D array for Tiled format
function flatten2DArray(arr) {
  return arr.flat();
}

// Create interactive objects
function createObjects() {
  const objects = [];
  let objectId = 1;
  
  // Spawn point
  objects.push({
    id: objectId++,
    name: "start",
    type: "start",
    x: 20 * TILE_SIZE,
    y: 25 * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    visible: true
  });
  
  // Meeting room 1 - with Jitsi
  objects.push({
    id: objectId++,
    name: "meeting-room-1",
    type: "zone",
    x: 2 * TILE_SIZE,
    y: 2 * TILE_SIZE,
    width: 8 * TILE_SIZE,
    height: 6 * TILE_SIZE,
    visible: true,
    properties: [
      { name: "jitsiRoom", type: "string", value: "CMNotes-MeetingRoom-Blue" },
      { name: "jitsiTrigger", type: "string", value: "onaction" },
      { name: "jitsiWidth", type: "int", value: 90 },
      { name: "openWebsiteTriggerMessage", type: "string", value: "Press SPACE to join video meeting" }
    ]
  });
  
  // Meeting room 2 - with Jitsi
  objects.push({
    id: objectId++,
    name: "meeting-room-2",
    type: "zone",
    x: 30 * TILE_SIZE,
    y: 2 * TILE_SIZE,
    width: 8 * TILE_SIZE,
    height: 6 * TILE_SIZE,
    visible: true,
    properties: [
      { name: "jitsiRoom", type: "string", value: "CMNotes-MeetingRoom-Green" },
      { name: "jitsiTrigger", type: "string", value: "onaction" },
      { name: "jitsiWidth", type: "int", value: 90 },
      { name: "openWebsiteTriggerMessage", type: "string", value: "Press SPACE to join video meeting" }
    ]
  });
  
  // Quiet zone 1 - silent area
  objects.push({
    id: objectId++,
    name: "quiet-zone-1",
    type: "zone",
    x: 2 * TILE_SIZE,
    y: 22 * TILE_SIZE,
    width: 8 * TILE_SIZE,
    height: 6 * TILE_SIZE,
    visible: true,
    properties: [
      { name: "silent", type: "bool", value: true },
      { name: "openWebsiteTriggerMessage", type: "string", value: "🔇 Quiet Zone - Microphones muted" }
    ]
  });
  
  // Creative space - with drawing board
  objects.push({
    id: objectId++,
    name: "creative-space",
    type: "zone",
    x: 30 * TILE_SIZE,
    y: 22 * TILE_SIZE,
    width: 8 * TILE_SIZE,
    height: 6 * TILE_SIZE,
    visible: true,
    properties: [
      { name: "openWebsite", type: "string", value: "https://excalidraw.com" },
      { name: "openWebsiteTrigger", type: "string", value: "onaction" },
      { name: "openWebsiteTriggerMessage", type: "string", value: "Press SPACE to open collaborative whiteboard" },
      { name: "openWebsiteWidth", type: "int", value: 90 }
    ]
  });
  
  // Cafe area - social space
  objects.push({
    id: objectId++,
    name: "cafe-area",
    type: "zone",
    x: 2 * TILE_SIZE,
    y: 10 * TILE_SIZE,
    width: 10 * TILE_SIZE,
    height: 10 * TILE_SIZE,
    visible: true,
    properties: [
      { name: "playAudio", type: "string", value: "./sounds/cafe-ambience.mp3" },
      { name: "playAudioLoop", type: "bool", value: true }
    ]
  });
  
  // Information board - CM's Note website
  objects.push({
    id: objectId++,
    name: "info-board",
    type: "zone",
    x: 19 * TILE_SIZE,
    y: 2 * TILE_SIZE,
    width: 2 * TILE_SIZE,
    height: 1 * TILE_SIZE,
    visible: true,
    properties: [
      { name: "openWebsite", type: "string", value: "https://cm-notes-web.vercel.app" },
      { name: "openWebsiteTrigger", type: "string", value: "onaction" },
      { name: "openWebsiteTriggerMessage", type: "string", value: "Press SPACE to view CM's Note website" }
    ]
  });
  
  // Welcome message
  objects.push({
    id: objectId++,
    name: "welcome-message",
    type: "zone",
    x: 19 * TILE_SIZE,
    y: 24 * TILE_SIZE,
    width: 2 * TILE_SIZE,
    height: 2 * TILE_SIZE,
    visible: true,
    properties: [
      { name: "focusable", type: "bool", value: true },
      { name: "openPopup", type: "string", value: "welcome" },
      { name: "openPopupEvent", type: "string", value: 
        "Welcome to CM's Note Virtual Town Hall!\\n\\n" +
        "🏢 Meeting Rooms: Video conferences\\n" +
        "☕ Cafe: Social area with ambience\\n" +
        "🤫 Quiet Zone: Muted for focus\\n" +
        "🎨 Creative Space: Collaborative whiteboard\\n\\n" +
        "Use arrow keys to move, SPACE to interact!"
      }
    ]
  });
  
  // Exit to GitHub
  objects.push({
    id: objectId++,
    name: "github-portal",
    type: "zone",
    x: 38 * TILE_SIZE,
    y: 14 * TILE_SIZE,
    width: 1 * TILE_SIZE,
    height: 2 * TILE_SIZE,
    visible: true,
    properties: [
      { name: "openWebsite", type: "string", value: "https://github.com/your-repo/cm-notes" },
      { name: "openWebsiteTrigger", type: "string", value: "onaction" },
      { name: "openWebsiteTriggerMessage", type: "string", value: "Press SPACE to visit GitHub repository" },
      { name: "openWebsitePolicy", type: "string", value: "_blank" }
    ]
  });
  

  

  

  
  // Variable storage areas for persistent data
  // These are invisible objects that allow scripts to store data
  objects.push({
    id: objectId++,
    name: "playerStats_*",
    type: "variable",
    x: 0,
    y: 0,
    width: 16,
    height: 16,
    visible: false,
    properties: [
      { name: "persist", type: "bool", value: true },
      { name: "public", type: "bool", value: false },
      { name: "jsonSchema", type: "string", value: JSON.stringify({
        type: "object",
        properties: {
          totalVisits: { type: "number" },
          totalChatMessages: { type: "number" },
          roomsVisited: { type: "array" },
          achievementsUnlocked: { type: "array" },
          timeSpent: { type: "number" },
          startTime: { type: "number" }
        }
      })}
    ]
  });
  
  objects.push({
    id: objectId++,
    name: "presence_*",
    type: "variable",
    x: 16,
    y: 0,
    width: 16,
    height: 16,
    visible: false,
    properties: [
      { name: "persist", type: "bool", value: false },
      { name: "public", type: "bool", value: true },
      { name: "jsonSchema", type: "string", value: JSON.stringify({
        type: "object",
        properties: {
          status: { type: "string" },
          lastSeen: { type: "number" },
          location: { type: "string" }
        }
      })}
    ]
  });
  
  return objects;
}

// Generate the complete map
function generateMap() {
  const { floorLayer, wallsLayer, decorLayer } = createMapData();
  const objects = createObjects();
  
  const map = {
    compressionlevel: -1,
    height: MAP_HEIGHT,
    infinite: false,
    layers: [
      {
        data: flatten2DArray(floorLayer),
        height: MAP_HEIGHT,
        id: 1,
        name: "floor",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: MAP_WIDTH,
        x: 0,
        y: 0
      },
      {
        data: flatten2DArray(wallsLayer),
        height: MAP_HEIGHT,
        id: 2,
        name: "walls",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: MAP_WIDTH,
        x: 0,
        y: 0,
        properties: [
          { name: "collides", type: "bool", value: true }
        ]
      },
      {
        data: flatten2DArray(decorLayer),
        height: MAP_HEIGHT,
        id: 3,
        name: "decoration",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: MAP_WIDTH,
        x: 0,
        y: 0,
        properties: [
          { name: "collides", type: "bool", value: true }
        ]
      },
      {
        // Sprite image layer
        id: 4,
        image: "sprite-resized.png",
        name: "sprite-image",
        offsetx: Math.floor((MAP_WIDTH - 8) / 2) * TILE_SIZE,  // Center horizontally (8 tiles wide)
        offsety: (MAP_HEIGHT - 8) * TILE_SIZE,                 // Bottom position (6 tiles high + 2 margin)
        opacity: 1,
        type: "imagelayer",
        visible: true,
        x: 0,
        y: 0
      },
      {
        // Iryslogo image layer
        id: 5,
        image: "iryslogo.png",
        name: "iryslogo-image",
        offsetx: Math.floor((MAP_WIDTH - 4) / 2) * TILE_SIZE,  // Center horizontally (4 tiles wide)
        offsety: Math.floor((MAP_HEIGHT - 4) / 2) * TILE_SIZE, // Center vertically (4 tiles high)
        opacity: 1,
        type: "imagelayer",
        visible: true,
        x: 0,
        y: 0
      },
      {
        draworder: "topdown",
        id: 6,
        name: "objects",
        objects: objects,
        opacity: 1,
        type: "objectgroup",
        visible: true,
        x: 0,
        y: 0
      }
    ],
    nextlayerid: 7,
    nextobjectid: objects.length + 1,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.7.2",
    tileheight: TILE_SIZE,
    tilesets: [
      {
        columns: 10,
        firstgid: 1,
        image: "cmnotes-tileset.png",
        imageheight: 192,  // Basic tiles only (6 rows * 32)
        imagewidth: 320,
        margin: 0,
        name: "cmnotes-tileset",
        spacing: 0,
        tilecount: 60,  // Basic tiles only (no sprite/iryslogo)
        tileheight: 32,
        tilewidth: 32,
        tiles: [
          // Define collision properties for specific tiles
          { id: 10, properties: [{ name: "collides", type: "bool", value: true }] },
          { id: 11, properties: [{ name: "collides", type: "bool", value: true }] },
          { id: 12, properties: [{ name: "collides", type: "bool", value: true }] },
          { id: 20, properties: [{ name: "collides", type: "bool", value: true }] },
          { id: 21, properties: [{ name: "collides", type: "bool", value: true }] },
          { id: 22, properties: [{ name: "collides", type: "bool", value: true }] },
          { id: 24, properties: [{ name: "collides", type: "bool", value: true }] },
          { id: 25, properties: [{ name: "collides", type: "bool", value: true }] },
          { id: 26, properties: [{ name: "collides", type: "bool", value: true }] },
          { id: 27, properties: [{ name: "collides", type: "bool", value: true }] }
        ]
      }
    ],
    tilewidth: TILE_SIZE,
    type: "map",
    version: "1.6",
    width: MAP_WIDTH,
    properties: [
      {
        name: "mapName",
        type: "string",
        value: "CM's Note Virtual Town Hall"
      },
      {
        name: "mapDescription",
        type: "string",
        value: "A virtual space for CM's Note community to meet, collaborate, and share ideas"
      },
      {
        name: "mapCopyright",
        type: "string",
        value: "CM's Note Team"
      },
      {
        name: "script",
        type: "string",
        value: "scripts/townhall.js"
      }
    ]
  };
  
  return map;
}

// Save the map
const mapData = generateMap();
const outputPath = path.join('public', 'workadventure-map', 'cmnotes-townhall.json');

// Ensure directory exists
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(mapData, null, 2));

console.log('✅ Cyberpunk map generated successfully!');
console.log(`📍 Location: ${outputPath}`);
console.log(`📐 Size: ${MAP_WIDTH}x${MAP_HEIGHT} tiles`);
console.log(`🎯 Objects: ${mapData.layers[5].objects.length} interactive zones`);
console.log('\n🤖 Cyber Layout:');
console.log('  • Cyber Meeting Rooms: Top corners (holo-conference)');
console.log('  • Tech Lounge: Left middle (social hub)');
console.log('  • Data Hub: Center (main nexus)');
console.log('  • Server Room: Bottom left (secure zone)');
console.log('  • Innovation Lab: Bottom right (holo-display)');
console.log('\n⚡ Ready to jack into WorkAdventure!');
