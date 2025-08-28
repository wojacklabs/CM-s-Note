const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create cyberpunk themed tileset for CM's Note Town Hall
async function generateTileset() {
console.log('🤖 Generating Cyberpunk CM\'s Note Town Hall Tileset...\n');

const TILE_SIZE = 32;
const TILES_PER_ROW = 10;
const TOTAL_TILES = 160; // Including sprite tiles and iryslogo tiles (up to 153)
const CANVAS_WIDTH = TILE_SIZE * TILES_PER_ROW;
const CANVAS_HEIGHT = Math.ceil(TOTAL_TILES / TILES_PER_ROW) * TILE_SIZE;

const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
const ctx = canvas.getContext('2d');

// Cyberpunk color palette
const colors = {
  darkGray: '#1a1a1a',
  mediumGray: '#2d3748',
  lightGray: '#4a5568',
  metallic: '#718096',
  neonCyan: '#51ffd6',
  neonPink: '#ff006e',
  orange: '#f97316',
  rust: '#92400e',
  darkBlue: '#1e293b',
  electricBlue: '#0ea5e9'
};

// Background
ctx.fillStyle = colors.darkGray;
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

// Helper function to draw tile at index
function drawTile(index, drawFunction) {
  const x = (index % TILES_PER_ROW) * TILE_SIZE;
  const y = Math.floor(index / TILES_PER_ROW) * TILE_SIZE;
  ctx.save();
  ctx.translate(x, y);
  drawFunction();
  ctx.restore();
}

// Helper function to add weathering effect
function addWeathering(amount = 3) {
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < amount; i++) {
    ctx.fillStyle = colors.rust;
    const x = Math.random() * (TILE_SIZE - 4);
    const y = Math.random() * (TILE_SIZE - 4);
    const size = 2 + Math.random() * 4;
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
}

// Tile 0: Empty/Transparent
drawTile(0, () => {
  // Leave empty
});

// === FLOOR TILES (1-9) ===

// Tile 1: Metal grid floor
drawTile(1, () => {
  // Base metal
  ctx.fillStyle = colors.mediumGray;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Grid pattern
  ctx.strokeStyle = colors.darkGray;
  ctx.lineWidth = 2;
  for (let i = 0; i <= TILE_SIZE; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, TILE_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(TILE_SIZE, i);
    ctx.stroke();
  }
  
  // Tech details - corner bolts
  ctx.fillStyle = colors.metallic;
  const drawBolt = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  };
  drawBolt(4, 4);
  drawBolt(28, 4);
  drawBolt(4, 28);
  drawBolt(28, 28);
  
  addWeathering(2);
});

// Tile 2: Neon accent floor
drawTile(2, () => {
  // Dark base
  ctx.fillStyle = colors.darkBlue;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Hexagonal pattern
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  
  const hexSize = 12;
  const drawHex = (cx, cy) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = cx + hexSize * Math.cos(angle);
      const y = cy + hexSize * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  };
  
  drawHex(16, 16);
  ctx.globalAlpha = 1;
  
  // Center glow
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 8);
  gradient.addColorStop(0, colors.neonCyan + '40');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
});

// Tile 3: Industrial plate
drawTile(3, () => {
  // Base
  ctx.fillStyle = colors.lightGray;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Diamond plate pattern
  ctx.fillStyle = colors.metallic;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if ((x + y) % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(x * 8 + 4, y * 8);
        ctx.lineTo(x * 8 + 8, y * 8 + 4);
        ctx.lineTo(x * 8 + 4, y * 8 + 8);
        ctx.lineTo(x * 8, y * 8 + 4);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  
  // Edge rivets
  ctx.fillStyle = colors.darkGray;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(2, i * 10 + 6, 1, 0, Math.PI * 2);
    ctx.arc(30, i * 10 + 6, 1, 0, Math.PI * 2);
    ctx.fill();
  }
});

// Tile 4: Holo floor
drawTile(4, () => {
  // Dark base
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Holographic grid
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  
  // Draw grid
  for (let i = 0; i <= TILE_SIZE; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, TILE_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(TILE_SIZE, i);
    ctx.stroke();
  }
  
  // Data flow effect
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = colors.neonCyan;
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * TILE_SIZE;
    const y = Math.random() * TILE_SIZE;
    ctx.fillRect(x, y, 2, 8);
  }
  ctx.globalAlpha = 1;
});

// Tile 5: Grated floor
drawTile(5, () => {
  // Metal base
  ctx.fillStyle = colors.mediumGray;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Grating
  ctx.fillStyle = colors.darkGray;
  for (let i = 2; i < TILE_SIZE; i += 6) {
    ctx.fillRect(i, 0, 2, TILE_SIZE);
    ctx.fillRect(0, i, TILE_SIZE, 2);
  }
  
  // Rust spots
  addWeathering(4);
});

// === WALL TILES (10-19) ===

// Tile 10: Tech panel wall
drawTile(10, () => {
  // Base
  ctx.fillStyle = colors.darkGray;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Panel
  ctx.fillStyle = colors.mediumGray;
  ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
  
  // Tech details
  ctx.fillStyle = colors.darkBlue;
  ctx.fillRect(4, 4, TILE_SIZE - 8, 8);
  
  // LED indicators
  ctx.fillStyle = colors.neonCyan;
  ctx.fillRect(6, 6, 4, 4);
  ctx.fillStyle = colors.orange;
  ctx.fillRect(14, 6, 4, 4);
  ctx.fillStyle = colors.neonPink;
  ctx.fillRect(22, 6, 4, 4);
  
  // Warning stripe
  ctx.fillStyle = colors.orange;
  ctx.fillRect(4, TILE_SIZE - 6, TILE_SIZE - 8, 2);
});

// Tile 11: Glass wall with hologram
drawTile(11, () => {
  // Frame
  ctx.fillStyle = colors.metallic;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Glass
  ctx.fillStyle = 'rgba(81, 255, 214, 0.2)';
  ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
  
  // Holographic display
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  
  // Data visualization
  ctx.beginPath();
  ctx.moveTo(6, 20);
  ctx.lineTo(10, 12);
  ctx.lineTo(16, 16);
  ctx.lineTo(22, 8);
  ctx.lineTo(26, 14);
  ctx.stroke();
  
  ctx.globalAlpha = 1;
  
  // Frame detail
  ctx.strokeStyle = colors.darkGray;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
});

// Tile 12: Industrial wall
drawTile(12, () => {
  // Base
  ctx.fillStyle = colors.mediumGray;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Panels with gaps
  ctx.fillStyle = colors.lightGray;
  ctx.fillRect(1, 1, 14, 14);
  ctx.fillRect(17, 1, 14, 14);
  ctx.fillRect(1, 17, 14, 14);
  ctx.fillRect(17, 17, 14, 14);
  
  // Weathering
  addWeathering(5);
  
  // Bolts
  ctx.fillStyle = colors.darkGray;
  const drawBolt = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  };
  drawBolt(8, 8);
  drawBolt(24, 8);
  drawBolt(8, 24);
  drawBolt(24, 24);
});

// === FURNITURE (20-39) ===

// Tile 20: Cyber desk
drawTile(20, () => {
  // Desktop
  ctx.fillStyle = colors.mediumGray;
  ctx.fillRect(0, 6, TILE_SIZE, 18);
  
  // Surface with tech pattern
  ctx.fillStyle = colors.darkBlue;
  ctx.fillRect(2, 8, TILE_SIZE - 4, 14);
  
  // Holographic interface
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.strokeRect(4, 10, 24, 10);
  
  // Data points
  ctx.fillStyle = colors.neonCyan;
  ctx.fillRect(6, 12, 2, 2);
  ctx.fillRect(12, 14, 2, 2);
  ctx.fillRect(18, 13, 2, 2);
  ctx.fillRect(24, 15, 2, 2);
  ctx.globalAlpha = 1;
  
  // Legs with neon accent
  ctx.fillStyle = colors.metallic;
  ctx.fillRect(4, 22, 4, 8);
  ctx.fillRect(24, 22, 4, 8);
  ctx.fillStyle = colors.neonCyan;
  ctx.fillRect(5, 28, 2, 2);
  ctx.fillRect(25, 28, 2, 2);
});

// Tile 21: Holo chair
drawTile(21, () => {
  // Seat
  ctx.fillStyle = colors.darkBlue;
  ctx.fillRect(6, 16, 20, 10);
  
  // Energy field effect
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(6, 16, 20, 10);
  ctx.globalAlpha = 1;
  
  // Back
  ctx.fillStyle = colors.mediumGray;
  ctx.fillRect(8, 4, 16, 12);
  
  // Holographic support
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(10, 6);
  ctx.lineTo(10, 14);
  ctx.moveTo(16, 6);
  ctx.lineTo(16, 14);
  ctx.moveTo(22, 6);
  ctx.lineTo(22, 14);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  // Base
  ctx.fillStyle = colors.metallic;
  ctx.fillRect(14, 26, 4, 4);
});

// Tile 22: Cyber couch
drawTile(22, () => {
  // Base structure
  ctx.fillStyle = colors.mediumGray;
  ctx.fillRect(2, 10, 28, 18);
  
  // Cushions with tech fabric
  ctx.fillStyle = colors.darkBlue;
  ctx.fillRect(4, 12, 12, 14);
  ctx.fillRect(16, 12, 12, 14);
  
  // Neon piping
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 12, 12, 14);
  ctx.strokeRect(16, 12, 12, 14);
  
  // Back with integrated lighting
  ctx.fillStyle = colors.lightGray;
  ctx.fillRect(2, 10, 28, 6);
  ctx.fillStyle = colors.neonCyan;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(2, 14, 28, 2);
  ctx.globalAlpha = 1;
});

// Tile 23: Holo plant
drawTile(23, () => {
  // Tech pot
  ctx.fillStyle = colors.metallic;
  ctx.beginPath();
  ctx.moveTo(10, 20);
  ctx.lineTo(22, 20);
  ctx.lineTo(20, 30);
  ctx.lineTo(12, 30);
  ctx.closePath();
  ctx.fill();
  
  // LED strip
  ctx.fillStyle = colors.neonCyan;
  ctx.fillRect(10, 22, 12, 1);
  
  // Holographic plant
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;
  
  // Geometric leaves
  ctx.beginPath();
  ctx.moveTo(16, 18);
  ctx.lineTo(10, 10);
  ctx.lineTo(16, 8);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(16, 18);
  ctx.lineTo(22, 10);
  ctx.lineTo(16, 8);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(16, 18);
  ctx.lineTo(16, 4);
  ctx.stroke();
  
  // Energy particles
  ctx.fillStyle = colors.neonCyan;
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const x = 16 + Math.cos(angle) * 8;
    const y = 12 + Math.sin(angle) * 8;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  ctx.globalAlpha = 1;
});

// Tile 24: Holo display board
drawTile(24, () => {
  // Frame
  ctx.fillStyle = colors.darkGray;
  ctx.fillRect(0, 2, TILE_SIZE, 24);
  
  // Holographic screen
  ctx.fillStyle = 'rgba(81, 255, 214, 0.1)';
  ctx.fillRect(2, 4, 28, 20);
  
  // Grid overlay
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  for (let i = 4; i < 28; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, 4);
    ctx.lineTo(i, 24);
    ctx.stroke();
  }
  for (let i = 8; i < 24; i += 6) {
    ctx.beginPath();
    ctx.moveTo(2, i);
    ctx.lineTo(30, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  
  // Data visualization
  ctx.fillStyle = colors.neonCyan;
  ctx.fillRect(4, 8, 8, 2);
  ctx.fillRect(4, 12, 16, 2);
  ctx.fillRect(4, 16, 12, 2);
  
  // Control panel
  ctx.fillStyle = colors.metallic;
  ctx.fillRect(0, 24, TILE_SIZE, 4);
  ctx.fillStyle = colors.orange;
  ctx.fillRect(14, 25, 4, 2);
});

// Tile 25: Data server rack
drawTile(25, () => {
  // Frame
  ctx.fillStyle = colors.darkGray;
  ctx.fillRect(4, 0, 24, 32);
  
  // Server modules
  const moduleColors = [colors.neonCyan, colors.orange, colors.neonPink];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = colors.mediumGray;
    ctx.fillRect(6, 2 + i * 5, 20, 4);
    
    // Status LEDs
    ctx.fillStyle = moduleColors[i % 3];
    ctx.fillRect(8, 3 + i * 5, 2, 2);
    ctx.fillRect(11, 3 + i * 5, 2, 2);
    
    // Vent grilles
    ctx.fillStyle = colors.darkGray;
    for (let j = 0; j < 3; j++) {
      ctx.fillRect(16 + j * 3, 3 + i * 5, 2, 2);
    }
  }
});

// Tile 26: Cyber terminal
drawTile(26, () => {
  // Monitor frame
  ctx.fillStyle = colors.metallic;
  ctx.fillRect(4, 2, 24, 20);
  
  // Screen
  ctx.fillStyle = '#000814';
  ctx.fillRect(6, 4, 20, 16);
  
  // Code/data display
  ctx.fillStyle = colors.neonCyan;
  ctx.font = '6px monospace';
  ctx.fillText('IRYS', 8, 9);
  ctx.fillText('NODE', 8, 14);
  ctx.fillText('ACTV', 8, 19);
  
  // Status bar
  ctx.fillStyle = colors.neonCyan;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(6, 18, 20, 2);
  ctx.globalAlpha = 1;
  
  // Stand with lighting
  ctx.fillStyle = colors.mediumGray;
  ctx.fillRect(14, 22, 4, 6);
  ctx.fillStyle = colors.darkGray;
  ctx.fillRect(10, 28, 12, 3);
  
  // Base LED
  ctx.fillStyle = colors.neonCyan;
  ctx.fillRect(15, 29, 2, 1);
});

// Tile 27: Energy dispenser
drawTile(27, () => {
  // Body
  ctx.fillStyle = colors.mediumGray;
  ctx.fillRect(6, 4, 20, 24);
  
  // Display panel
  ctx.fillStyle = colors.darkBlue;
  ctx.fillRect(8, 6, 16, 8);
  
  // Energy level indicator
  ctx.fillStyle = colors.neonCyan;
  ctx.fillRect(10, 8, 3, 4);
  ctx.fillRect(14, 8, 3, 4);
  ctx.fillRect(18, 8, 3, 4);
  
  // Dispenser outlet
  ctx.fillStyle = colors.darkGray;
  ctx.fillRect(12, 18, 8, 4);
  
  // Energy flow effect
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(16, 20);
  ctx.lineTo(16, 26);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  // Base with warning
  ctx.fillStyle = colors.metallic;
  ctx.fillRect(6, 24, 20, 4);
  ctx.fillStyle = colors.orange;
  ctx.fillRect(6, 26, 20, 2);
});

// === SPECIAL TILES (50+) ===

// Tile 50: Spawn portal
drawTile(50, () => {
  // Portal ring
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, Math.PI * 2);
  ctx.stroke();
  
  // Energy field
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 12);
  gradient.addColorStop(0, colors.neonCyan + '80');
  gradient.addColorStop(0.5, colors.neonCyan + '40');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Tech details
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = 16 + Math.cos(angle) * 14;
    const y1 = 16 + Math.sin(angle) * 14;
    const x2 = 16 + Math.cos(angle) * 10;
    const y2 = 16 + Math.sin(angle) * 10;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
});

// Tile 51: Teleporter pad
drawTile(51, () => {
  // Base platform
  ctx.fillStyle = colors.metallic;
  ctx.fillRect(2, 2, 28, 28);
  
  // Warning stripes
  ctx.fillStyle = colors.orange;
  ctx.fillRect(2, 2, 4, 28);
  ctx.fillRect(26, 2, 4, 28);
  ctx.fillRect(2, 2, 28, 4);
  ctx.fillRect(2, 26, 28, 4);
  
  // Energy core
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 10);
  gradient.addColorStop(0, colors.neonPink + 'CC');
  gradient.addColorStop(0.5, colors.neonPink + '66');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(6, 6, 20, 20);
  
  // Tech pattern
  ctx.strokeStyle = colors.neonPink;
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, 16, 16);
  ctx.strokeRect(10, 10, 12, 12);
  ctx.strokeRect(12, 12, 8, 8);
});

// Tile 52: Sprite marker/placeholder
drawTile(52, () => {
  // Create a special floor tile to mark where sprite should be
  // Cyberpunk style floor with image marker
  ctx.fillStyle = colors.darkBlue;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Grid pattern
  ctx.strokeStyle = colors.neonCyan;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  for (let i = 0; i <= TILE_SIZE; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, TILE_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(TILE_SIZE, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  
  // Center marker
  ctx.fillStyle = colors.neonCyan;
  ctx.beginPath();
  ctx.arc(16, 16, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // "IMG" text
  ctx.fillStyle = colors.darkBlue;
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('IMG', 10, 19);
});

// Add sprite tiles (53-106) - 6x9 grid
console.log('🎨 Adding sprite tiles...');

// Check if sprite-fixed.png exists, otherwise try sprite-resized.png
const spriteResizedPath = path.join('public', 'workadventure-map', 'sprite-fixed.png');
const spritePath = path.join('public', 'workadventure-map', 'sprite.png');
let spriteImagePath = null;

if (fs.existsSync(spriteResizedPath)) {
  spriteImagePath = spriteResizedPath;
} else if (fs.existsSync(spritePath)) {
  spriteImagePath = spritePath;
}

if (spriteImagePath) {
  const spriteImage = await loadImage(spriteImagePath);
  
  // sprite-resized is 8x6 tiles = 256x192 pixels
  const spriteTileWidth = 8;
  const spriteTileHeight = 6;
  const spriteTileSize = 32;
  // Start sprite at beginning of new row to avoid wrapping
  let tileIndex = 60; // Row 6, Column 0
  
  for (let row = 0; row < spriteTileHeight; row++) {
    for (let col = 0; col < spriteTileWidth; col++) {
      // Calculate tile index ensuring each sprite row starts at new tileset row
      const currentTileIndex = 60 + (row * 10) + col;  // Each row jumps by 10 (tileset width)
      drawTile(currentTileIndex, () => {
        // Draw portion of sprite
        ctx.drawImage(
          spriteImage,
          col * spriteTileSize,  // source x
          row * spriteTileSize,  // source y
          spriteTileSize,        // source width
          spriteTileSize,        // source height
          0,                     // dest x
          0,                     // dest y
          TILE_SIZE,             // dest width
          TILE_SIZE              // dest height
        );
      });
    }
  }
  console.log('✅ Added sprite as tiles (rows 6-10, 8 tiles per row)');
} else {
  console.log('⚠️  sprite image not found, creating placeholder tiles');
  // Create placeholder tiles for sprite
  // Create placeholder tiles matching the sprite layout
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 8; col++) {
      const i = 60 + (row * 10) + col;
    drawTile(i, () => {
      // Cyberpunk style placeholder
      ctx.fillStyle = colors.darkGray;
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // Border
      ctx.strokeStyle = colors.neonCyan;
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
      
      // Text
      ctx.fillStyle = colors.neonPink;
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('SPR', 8, 20);
    });
    }
  }
}

// Add iryslogo tiles (101-116) - 4x4 grid
console.log('🎨 Adding iryslogo tiles...');

// Check if iryslogo.png exists
const iryslogoPath = path.join('public', 'workadventure-map', 'iryslogo-fixed.png');
if (fs.existsSync(iryslogoPath)) {
  const iryslogoImage = await loadImage(iryslogoPath);
  
  // iryslogo is 128x128, divide into 4x4 = 16 tiles of 32x32 each
  const iryslogoTileSize = 32;
  // Start iryslogo at beginning of new row to avoid wrapping
  let tileIndex = 120; // Row 12, Column 0 (to avoid overlap with sprite)
  
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      // Calculate tile index ensuring each iryslogo row starts at new tileset row
      const currentTileIndex = 120 + (row * 10) + col;  // Each row jumps by 10 (tileset width)
      drawTile(currentTileIndex, () => {
        // Draw portion of iryslogo
        ctx.drawImage(
          iryslogoImage,
          col * iryslogoTileSize,  // source x
          row * iryslogoTileSize,  // source y
          iryslogoTileSize,        // source width
          iryslogoTileSize,        // source height
          0,                       // dest x
          0,                       // dest y
          TILE_SIZE,               // dest width
          TILE_SIZE                // dest height
        );
      });
    }
  }
  console.log('✅ Added iryslogo as tiles (rows 12-15, 4 tiles per row)');
} else {
  console.log('⚠️  iryslogo.png not found, creating placeholder tiles');
  // Create placeholder tiles for iryslogo matching the layout
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const i = 120 + (row * 10) + col;
    drawTile(i, () => {
      // Cyberpunk style placeholder
      ctx.fillStyle = colors.darkBlue;
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // Border
      ctx.strokeStyle = colors.neonPink;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
      
      // Text
      ctx.fillStyle = colors.neonCyan;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('IRYS', 4, 20);
    });
    }
  }
}

// Save tileset
const outputPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log('✅ Cyberpunk tileset generated successfully!');
console.log(`📍 Location: ${outputPath}`);
console.log(`🎨 Size: ${CANVAS_WIDTH}x${CANVAS_HEIGHT} pixels`);
console.log(`🔢 Tiles: ${TOTAL_TILES} total tile slots`);
console.log(`🎯 Theme: Cyberpunk with ${colors.neonCyan} highlight`);

// Generate tileset definition file
const tilesetDef = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.5" tiledversion="1.7.2" name="cmnotes-tileset" tilewidth="32" tileheight="32" tilecount="${TOTAL_TILES}" columns="${TILES_PER_ROW}">
 <image source="cmnotes-tileset.png" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"/>
 <tile id="0">
  <properties>
   <property name="collides" type="bool" value="false"/>
  </properties>
 </tile>
 <tile id="10">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="11">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="12">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="20">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="21">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="22">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="24">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="25">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="26">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="27">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
</tileset>`;

const tsxPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.tsx');
fs.writeFileSync(tsxPath, tilesetDef);

console.log(`📄 Tileset definition: ${tsxPath}`);
console.log('\n🤖 Cyberpunk Tile Categories:');
console.log('  • 0: Empty');
console.log('  • 1-9: Tech floors (metal grid, neon accent, industrial, holo)');
console.log('  • 10-19: Cyber walls (tech panels, holo glass, industrial)');
console.log('  • 20-39: Future furniture (cyber desk, holo chair, data server, etc.)');
console.log('  • 50+: Special tiles (spawn portal, teleporter pad)');
console.log('  • 60+: Sprite tiles (8x6 grid, using rows 6-11)');
console.log('  • 120+: Iryslogo tiles (4x4 grid, using rows 12-15)');
}

// Run the async function
generateTileset().catch(console.error);
