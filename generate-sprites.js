const fs = require('fs');
const { createCanvas } = require('canvas');

// Create tileset (32x32 tiles)
function createTileset() {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  
  // Tile 0: Floor (gray)
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(1, 1, 30, 30);
  
  // Tile 1: Wall (dark gray)
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(32, 0, 32, 32);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(33, 1, 30, 30);
  
  // Tile 2: Exhibition zone (blue tinted)
  ctx.fillStyle = '#3a4a5a';
  ctx.fillRect(64, 0, 32, 32);
  ctx.fillStyle = '#2a3a4a';
  ctx.fillRect(65, 1, 30, 30);
  
  // Tile 3: Decoration (gold)
  ctx.fillStyle = '#8a7a3a';
  ctx.fillRect(96, 0, 32, 32);
  ctx.fillStyle = '#7a6a2a';
  ctx.fillRect(97, 1, 30, 30);
  
  // Add grid lines for pixel art effect
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 32; j += 8) {
      ctx.strokeRect(i * 32 + j, 0, 8, 32);
      ctx.strokeRect(i * 32, j, 32, 8);
    }
  }
  
  return canvas.toBuffer('image/png');
}

// Create player spritesheet (32x32 per frame)
function createPlayerSpritesheet() {
  const canvas = createCanvas(128, 128); // 4x4 frames
  const ctx = canvas.getContext('2d');
  
  // Helper function to draw a simple pixel character
  function drawCharacter(x, y, color) {
    // Clear background
    ctx.fillStyle = 'transparent';
    ctx.clearRect(x, y, 32, 32);
    
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x + 12, y + 12, 8, 12);
    
    // Head
    ctx.fillStyle = '#fdbcb4'; // Skin color
    ctx.fillRect(x + 12, y + 4, 8, 8);
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 14, y + 6, 2, 2);
    ctx.fillRect(x + 18, y + 6, 2, 2);
    
    // Hair
    ctx.fillStyle = '#654321';
    ctx.fillRect(x + 12, y + 4, 8, 3);
    
    // Arms
    ctx.fillStyle = color;
    ctx.fillRect(x + 8, y + 12, 4, 8);
    ctx.fillRect(x + 20, y + 12, 4, 8);
    
    // Legs
    ctx.fillStyle = '#000080'; // Dark blue for pants
    ctx.fillRect(x + 12, y + 24, 3, 6);
    ctx.fillRect(x + 17, y + 24, 3, 6);
  }
  
  // Down-facing frames
  drawCharacter(0, 0, '#ff0000');   // Frame 0
  drawCharacter(32, 0, '#ff0000');  // Frame 1 (walking)
  drawCharacter(64, 0, '#ff0000');  // Frame 2
  drawCharacter(96, 0, '#ff0000');  // Frame 3 (walking)
  
  // Right-facing frames
  drawCharacter(0, 32, '#00ff00');   // Frame 4
  drawCharacter(32, 32, '#00ff00');  // Frame 5 (walking)
  drawCharacter(64, 32, '#00ff00');  // Frame 6
  drawCharacter(96, 32, '#00ff00');  // Frame 7 (walking)
  
  // Up-facing frames
  drawCharacter(0, 64, '#0000ff');   // Frame 8
  drawCharacter(32, 64, '#0000ff');  // Frame 9 (walking)
  drawCharacter(64, 64, '#0000ff');  // Frame 10
  drawCharacter(96, 64, '#0000ff');  // Frame 11 (walking)
  
  // Left-facing frames
  drawCharacter(0, 96, '#ffff00');   // Frame 12
  drawCharacter(32, 96, '#ffff00');  // Frame 13 (walking)
  drawCharacter(64, 96, '#ffff00');  // Frame 14
  drawCharacter(96, 96, '#ffff00');  // Frame 15 (walking)
  
  return canvas.toBuffer('image/png');
}

// Check if canvas module is installed
try {
  // Save tileset
  fs.writeFileSync('public/assets/sprites/tileset.png', createTileset());
  console.log('✅ Created tileset.png');
  
  // Save player spritesheet
  fs.writeFileSync('public/assets/sprites/player_spritesheet.png', createPlayerSpritesheet());
  console.log('✅ Created player_spritesheet.png');
  
  console.log('\n🎮 Sprites generated successfully!');
} catch (error) {
  console.log('Canvas module not found. Creating placeholder files...');
  
  // Create placeholder PNG files (1x1 transparent pixel)
  const placeholderPNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x01, 0x03, 0x00, 0x00, 0x00, 0x25, 0xdb, 0x56, 0xca, 0x00, 0x00, 0x00,
    0x03, 0x50, 0x4c, 0x54, 0x45, 0x00, 0x00, 0x00, 0xa7, 0x7a, 0x3d, 0xda,
    0x00, 0x00, 0x00, 0x01, 0x74, 0x52, 0x4e, 0x53, 0x00, 0x40, 0xe6, 0xd8,
    0x66, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63,
    0x60, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync('public/assets/sprites/tileset.png', placeholderPNG);
  fs.writeFileSync('public/assets/sprites/player_spritesheet.png', placeholderPNG);
  
  console.log('⚠️  Created placeholder sprites. For better graphics, install canvas module:');
  console.log('   npm install canvas');
}
