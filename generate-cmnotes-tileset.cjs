const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create professional tileset for CM's Note Town Hall
console.log('🎨 Generating CM\'s Note Town Hall Tileset...\n');

const TILE_SIZE = 32;
const TILES_PER_ROW = 10;
const TOTAL_TILES = 60;
const CANVAS_WIDTH = TILE_SIZE * TILES_PER_ROW;
const CANVAS_HEIGHT = Math.ceil(TOTAL_TILES / TILES_PER_ROW) * TILE_SIZE;

const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#1a1a1a';
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

// Tile 0: Empty/Transparent
drawTile(0, () => {
  // Leave empty
});

// === FLOOR TILES (1-9) ===

// Tile 1: Marble floor
drawTile(1, () => {
  // Base
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Marble pattern
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.quadraticCurveTo(16, 12, 32, 16);
  ctx.stroke();
  
  // Shine effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(0, 0, TILE_SIZE, 2);
});

// Tile 2: Wood floor
drawTile(2, () => {
  // Wood base
  ctx.fillStyle = '#8B6F47';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Wood grain
  ctx.strokeStyle = '#6B5637';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 8 + 4);
    ctx.lineTo(32, i * 8 + 4);
    ctx.stroke();
  }
  
  // Plank edges
  ctx.strokeStyle = '#5B4627';
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
});

// Tile 3: Blue carpet
drawTile(3, () => {
  // Base
  ctx.fillStyle = '#4A90E2';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Texture pattern
  ctx.fillStyle = '#3A80D2';
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillRect(x * 8, y * 8, 8, 8);
      }
    }
  }
  
  // Soft edge
  ctx.strokeStyle = '#5AA0F2';
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
});

// Tile 4: Red carpet
drawTile(4, () => {
  // Base
  ctx.fillStyle = '#DC143C';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Pattern
  ctx.fillStyle = '#CC042C';
  for (let i = 0; i < 16; i++) {
    ctx.fillRect(i * 4, 0, 2, TILE_SIZE);
  }
  
  // Border
  ctx.strokeStyle = '#BC041C';
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
});

// Tile 5: Grass/Garden
drawTile(5, () => {
  // Base
  ctx.fillStyle = '#7CB342';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Grass blades
  ctx.strokeStyle = '#689F38';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * TILE_SIZE;
    const y = Math.random() * TILE_SIZE;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y - 4);
    ctx.stroke();
  }
});

// === WALL TILES (10-19) ===

// Tile 10: Brick wall
drawTile(10, () => {
  // Base
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Bricks
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 1;
  
  // Horizontal lines
  for (let y = 0; y < 4; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * 8);
    ctx.lineTo(32, y * 8);
    ctx.stroke();
  }
  
  // Vertical lines (offset pattern)
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const offset = (y % 2) * 8;
      ctx.beginPath();
      ctx.moveTo(x * 16 + offset, y * 8);
      ctx.lineTo(x * 16 + offset, (y + 1) * 8);
      ctx.stroke();
    }
  }
});

// Tile 11: Glass wall
drawTile(11, () => {
  // Frame
  ctx.fillStyle = '#455A64';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Glass
  ctx.fillStyle = 'rgba(176, 224, 230, 0.6)';
  ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
  
  // Reflection
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(2, 2, TILE_SIZE - 4, 8);
  
  // Frame detail
  ctx.strokeStyle = '#37474F';
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  ctx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
});

// Tile 12: Wood panel wall
drawTile(12, () => {
  // Base
  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  
  // Panels
  ctx.strokeStyle = '#5D3C31';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 12, 12);
  ctx.strokeRect(18, 2, 12, 12);
  ctx.strokeRect(2, 18, 12, 12);
  ctx.strokeRect(18, 18, 12, 12);
  
  // Border
  ctx.strokeStyle = '#4D2C21';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
});

// === FURNITURE (20-39) ===

// Tile 20: Modern desk
drawTile(20, () => {
  // Desktop
  ctx.fillStyle = '#607D8B';
  ctx.fillRect(0, 4, TILE_SIZE, 20);
  
  // Surface
  ctx.fillStyle = '#546E7A';
  ctx.fillRect(2, 6, TILE_SIZE - 4, 16);
  
  // Legs
  ctx.fillStyle = '#455A64';
  ctx.fillRect(4, 22, 4, 8);
  ctx.fillRect(24, 22, 4, 8);
});

// Tile 21: Office chair
drawTile(21, () => {
  // Seat
  ctx.fillStyle = '#1976D2';
  ctx.fillRect(6, 16, 20, 12);
  
  // Back
  ctx.fillStyle = '#1565C0';
  ctx.fillRect(8, 4, 16, 12);
  
  // Base
  ctx.fillStyle = '#424242';
  ctx.fillRect(14, 28, 4, 4);
  
  // Wheels
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(10, 30, 2, 0, Math.PI * 2);
  ctx.arc(22, 30, 2, 0, Math.PI * 2);
  ctx.fill();
});

// Tile 22: Modern sofa
drawTile(22, () => {
  // Base
  ctx.fillStyle = '#FF7043';
  ctx.fillRect(2, 8, 28, 20);
  
  // Cushions
  ctx.fillStyle = '#FF5722';
  ctx.fillRect(4, 10, 12, 16);
  ctx.fillRect(16, 10, 12, 16);
  
  // Back
  ctx.fillStyle = '#E64A19';
  ctx.fillRect(2, 8, 28, 8);
});

// Tile 23: Potted plant
drawTile(23, () => {
  // Pot
  ctx.fillStyle = '#795548';
  ctx.beginPath();
  ctx.moveTo(10, 20);
  ctx.lineTo(22, 20);
  ctx.lineTo(20, 30);
  ctx.lineTo(12, 30);
  ctx.closePath();
  ctx.fill();
  
  // Plant
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.arc(16, 12, 10, 0, Math.PI * 2);
  ctx.fill();
  
  // Leaves detail
  ctx.fillStyle = '#388E3C';
  ctx.beginPath();
  ctx.arc(12, 10, 4, 0, Math.PI * 2);
  ctx.arc(20, 10, 4, 0, Math.PI * 2);
  ctx.arc(16, 16, 4, 0, Math.PI * 2);
  ctx.fill();
});

// Tile 24: Whiteboard
drawTile(24, () => {
  // Frame
  ctx.fillStyle = '#37474F';
  ctx.fillRect(0, 2, TILE_SIZE, 24);
  
  // Board
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(2, 4, 28, 20);
  
  // Writing
  ctx.strokeStyle = '#2196F3';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 8);
  ctx.lineTo(12, 8);
  ctx.moveTo(4, 12);
  ctx.lineTo(20, 12);
  ctx.moveTo(4, 16);
  ctx.lineTo(16, 16);
  ctx.stroke();
  
  // Marker tray
  ctx.fillStyle = '#263238';
  ctx.fillRect(0, 24, TILE_SIZE, 4);
});

// Tile 25: Bookshelf
drawTile(25, () => {
  // Frame
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(2, 0, 28, 32);
  
  // Shelves
  ctx.fillStyle = '#4E342E';
  ctx.fillRect(4, 2, 24, 1);
  ctx.fillRect(4, 10, 24, 1);
  ctx.fillRect(4, 20, 24, 1);
  ctx.fillRect(4, 30, 24, 1);
  
  // Books
  const bookColors = ['#F44336', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0'];
  
  // Top shelf
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = bookColors[i];
    ctx.fillRect(5 + i * 5, 3, 4, 7);
  }
  
  // Middle shelf
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = bookColors[(i + 2) % 5];
    ctx.fillRect(5 + i * 5, 11, 4, 8);
  }
  
  // Bottom shelf
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = bookColors[(i + 4) % 5];
    ctx.fillRect(5 + i * 5, 21, 4, 8);
  }
});

// Tile 26: Computer/Monitor
drawTile(26, () => {
  // Monitor
  ctx.fillStyle = '#263238';
  ctx.fillRect(4, 4, 24, 18);
  
  // Screen
  ctx.fillStyle = '#000000';
  ctx.fillRect(6, 6, 20, 14);
  
  // Screen content (code)
  ctx.fillStyle = '#00FF00';
  ctx.font = '8px monospace';
  ctx.fillText('CM', 8, 12);
  ctx.fillText('Note', 8, 18);
  
  // Stand
  ctx.fillStyle = '#37474F';
  ctx.fillRect(14, 22, 4, 6);
  ctx.fillRect(10, 28, 12, 2);
});

// Tile 27: Coffee machine
drawTile(27, () => {
  // Body
  ctx.fillStyle = '#424242';
  ctx.fillRect(6, 4, 20, 24);
  
  // Display
  ctx.fillStyle = '#1976D2';
  ctx.fillRect(8, 6, 16, 6);
  
  // Coffee outlet
  ctx.fillStyle = '#212121';
  ctx.fillRect(12, 20, 8, 4);
  
  // Cup area
  ctx.fillStyle = '#757575';
  ctx.fillRect(6, 24, 20, 4);
  
  // Steam
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, 2);
  ctx.quadraticCurveTo(16, 0, 14, -2);
  ctx.stroke();
});

// === SPECIAL TILES (50+) ===

// Tile 50: Spawn point marker
drawTile(50, () => {
  // Circle
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, Math.PI * 2);
  ctx.stroke();
  
  // Arrow
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.moveTo(16, 8);
  ctx.lineTo(12, 16);
  ctx.lineTo(16, 14);
  ctx.lineTo(20, 16);
  ctx.closePath();
  ctx.fill();
});

// Tile 51: Portal/Teleporter
drawTile(51, () => {
  // Outer ring
  ctx.strokeStyle = '#E91E63';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner energy
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 12);
  gradient.addColorStop(0, 'rgba(233, 30, 99, 0.8)');
  gradient.addColorStop(1, 'rgba(233, 30, 99, 0.1)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(16, 16, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Particles
  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = 16 + Math.cos(angle) * 8;
    const y = 16 + Math.sin(angle) * 8;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
});

// Save tileset
const outputPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log('✅ Tileset generated successfully!');
console.log(`📍 Location: ${outputPath}`);
console.log(`🎨 Size: ${CANVAS_WIDTH}x${CANVAS_HEIGHT} pixels`);
console.log(`🔢 Tiles: ${TOTAL_TILES} unique tiles`);

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
console.log('\n🎯 Tile Categories:');
console.log('  • 0: Empty');
console.log('  • 1-9: Floor tiles (marble, wood, carpets, grass)');
console.log('  • 10-19: Wall tiles (brick, glass, wood panel)');
console.log('  • 20-39: Furniture (desk, chair, sofa, plants, etc.)');
console.log('  • 50+: Special tiles (spawn point, portal)');
