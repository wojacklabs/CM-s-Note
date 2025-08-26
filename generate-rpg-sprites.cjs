const fs = require('fs');
const { createCanvas } = require('canvas');

// RPG Maker style tile size
const TILE_SIZE = 32;

// Create RPG-style tileset
function createRPGTileset() {
  const canvas = createCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  
  // Helper function for pixel-perfect drawing
  function drawPixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }
  
  // Tile 0: Wooden floor
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      // Wood grain pattern
      const isGrain = (x + y * 2) % 8 < 2;
      const color = isGrain ? '#8B6336' : '#A0522D';
      drawPixel(x, y, color);
    }
  }
  // Add wood lines
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 1;
  for (let i = 0; i < 32; i += 8) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(32, i);
    ctx.stroke();
  }
  
  // Tile 1: Marble floor (exhibition area)
  for (let y = 0; y < 32; y++) {
    for (let x = 32; x < 64; x++) {
      const marble = ((x - 32) + y) % 2 === 0 ? '#F0F0F0' : '#E8E8E8';
      drawPixel(x, y, marble);
    }
  }
  // Add marble veins
  ctx.strokeStyle = '#CCCCCC';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(32 + 5, 5);
  ctx.lineTo(32 + 25, 20);
  ctx.moveTo(32 + 10, 25);
  ctx.lineTo(32 + 30, 30);
  ctx.stroke();
  
  // Tile 2: Red carpet
  for (let y = 0; y < 32; y++) {
    for (let x = 64; x < 96; x++) {
      const isBorder = (x === 64 || x === 95 || y === 0 || y === 31);
      const color = isBorder ? '#FFD700' : '#DC143C';
      drawPixel(x, y, color);
    }
  }
  
  // Tile 3: Wall (top part)
  for (let y = 0; y < 32; y++) {
    for (let x = 96; x < 128; x++) {
      const color = y < 24 ? '#DEB887' : '#8B7355';
      drawPixel(x, y, color);
    }
  }
  
  // Tile 4: Potted plant decoration
  ctx.fillStyle = '#654321'; // Pot
  ctx.fillRect(128, 20, 12, 12);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(130, 22, 8, 8);
  // Plant
  ctx.fillStyle = '#228B22';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(134, 10 + i * 2, 4, 3);
    ctx.fillRect(132 - i/2, 12 + i * 2, 8 + i, 2);
  }
  
  // Tile 5: Picture frame
  ctx.fillStyle = '#FFD700'; // Gold frame
  ctx.fillRect(160, 4, 24, 24);
  ctx.fillStyle = '#4682B4'; // Picture
  ctx.fillRect(164, 8, 16, 16);
  // Add details
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(168, 12, 8, 8);
  
  return canvas.toBuffer('image/png');
}

// Create cute RPG character spritesheet
function createRPGCharacterSpritesheet() {
  const canvas = createCanvas(384, 256); // 12x8 grid of 32x32 sprites
  const ctx = canvas.getContext('2d');
  
  // Character template function
  function drawCharacter(startX, startY, skinColor, hairColor, shirtColor, pantsColor, facing = 'down') {
    const x = startX;
    const y = startY;
    
    // Clear background
    ctx.fillStyle = 'transparent';
    ctx.clearRect(x, y, 32, 32);
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 10, y + 28, 12, 4);
    
    if (facing === 'down') {
      // Hair (back)
      ctx.fillStyle = hairColor;
      ctx.fillRect(x + 10, y + 6, 12, 8);
      
      // Head
      ctx.fillStyle = skinColor;
      ctx.fillRect(x + 11, y + 8, 10, 10);
      
      // Hair (front)
      ctx.fillStyle = hairColor;
      ctx.fillRect(x + 10, y + 6, 12, 4);
      ctx.fillRect(x + 9, y + 7, 14, 2);
      
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 13, y + 12, 2, 2);
      ctx.fillRect(x + 17, y + 12, 2, 2);
      
      // Mouth
      ctx.fillRect(x + 15, y + 15, 2, 1);
      
      // Body
      ctx.fillStyle = shirtColor;
      ctx.fillRect(x + 11, y + 18, 10, 8);
      
      // Arms
      ctx.fillStyle = skinColor;
      ctx.fillRect(x + 8, y + 20, 3, 6);
      ctx.fillRect(x + 21, y + 20, 3, 6);
      ctx.fillStyle = shirtColor;
      ctx.fillRect(x + 8, y + 20, 3, 3);
      ctx.fillRect(x + 21, y + 20, 3, 3);
      
      // Legs
      ctx.fillStyle = pantsColor;
      ctx.fillRect(x + 12, y + 26, 3, 4);
      ctx.fillRect(x + 17, y + 26, 3, 4);
    } else if (facing === 'up') {
      // Hair
      ctx.fillStyle = hairColor;
      ctx.fillRect(x + 10, y + 6, 12, 10);
      
      // Head (back view)
      ctx.fillStyle = skinColor;
      ctx.fillRect(x + 11, y + 10, 10, 8);
      
      // Body
      ctx.fillStyle = shirtColor;
      ctx.fillRect(x + 11, y + 18, 10, 8);
      
      // Arms
      ctx.fillStyle = skinColor;
      ctx.fillRect(x + 8, y + 20, 3, 6);
      ctx.fillRect(x + 21, y + 20, 3, 6);
      ctx.fillStyle = shirtColor;
      ctx.fillRect(x + 8, y + 20, 3, 3);
      ctx.fillRect(x + 21, y + 20, 3, 3);
      
      // Legs
      ctx.fillStyle = pantsColor;
      ctx.fillRect(x + 12, y + 26, 3, 4);
      ctx.fillRect(x + 17, y + 26, 3, 4);
    } else if (facing === 'left' || facing === 'right') {
      const flip = facing === 'right';
      
      // Hair
      ctx.fillStyle = hairColor;
      ctx.fillRect(x + (flip ? 11 : 10), y + 6, 10, 8);
      
      // Head
      ctx.fillStyle = skinColor;
      ctx.fillRect(x + (flip ? 12 : 11), y + 8, 8, 10);
      
      // Eye
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + (flip ? 17 : 14), y + 12, 2, 2);
      
      // Body
      ctx.fillStyle = shirtColor;
      ctx.fillRect(x + (flip ? 12 : 11), y + 18, 8, 8);
      
      // Front arm
      ctx.fillStyle = skinColor;
      ctx.fillRect(x + (flip ? 19 : 9), y + 20, 3, 6);
      ctx.fillStyle = shirtColor;
      ctx.fillRect(x + (flip ? 19 : 9), y + 20, 3, 3);
      
      // Legs
      ctx.fillStyle = pantsColor;
      ctx.fillRect(x + (flip ? 13 : 12), y + 26, 3, 4);
      ctx.fillRect(x + (flip ? 16 : 15), y + 26, 3, 4);
    }
  }
  
  // Generate multiple character variations
  const characters = [
    { skin: '#FDBCB4', hair: '#8B4513', shirt: '#FF6B6B', pants: '#4169E1' }, // Character 1
    { skin: '#FFE4C4', hair: '#FFD700', shirt: '#90EE90', pants: '#708090' }, // Character 2
    { skin: '#DEB887', hair: '#000000', shirt: '#9370DB', pants: '#2F4F4F' }, // Character 3
    { skin: '#F0E68C', hair: '#DC143C', shirt: '#FFB6C1', pants: '#000080' }, // Character 4
  ];
  
  // Draw characters in all directions
  characters.forEach((char, charIndex) => {
    const baseX = charIndex * 96;
    
    // Down-facing (frames 0-2)
    drawCharacter(baseX, 0, char.skin, char.hair, char.shirt, char.pants, 'down');
    drawCharacter(baseX + 32, 0, char.skin, char.hair, char.shirt, char.pants, 'down');
    drawCharacter(baseX + 64, 0, char.skin, char.hair, char.shirt, char.pants, 'down');
    
    // Left-facing (frames 3-5)
    drawCharacter(baseX, 32, char.skin, char.hair, char.shirt, char.pants, 'left');
    drawCharacter(baseX + 32, 32, char.skin, char.hair, char.shirt, char.pants, 'left');
    drawCharacter(baseX + 64, 32, char.skin, char.hair, char.shirt, char.pants, 'left');
    
    // Right-facing (frames 6-8)
    drawCharacter(baseX, 64, char.skin, char.hair, char.shirt, char.pants, 'right');
    drawCharacter(baseX + 32, 64, char.skin, char.hair, char.shirt, char.pants, 'right');
    drawCharacter(baseX + 64, 64, char.skin, char.hair, char.shirt, char.pants, 'right');
    
    // Up-facing (frames 9-11)
    drawCharacter(baseX, 96, char.skin, char.hair, char.shirt, char.pants, 'up');
    drawCharacter(baseX + 32, 96, char.skin, char.hair, char.shirt, char.pants, 'up');
    drawCharacter(baseX + 64, 96, char.skin, char.hair, char.shirt, char.pants, 'up');
  });
  
  return canvas.toBuffer('image/png');
}

// Create decorative objects spritesheet
function createDecorationsSpritesheet() {
  const canvas = createCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  
  // Trophy
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(10, 20, 12, 8);
  ctx.fillRect(8, 12, 16, 8);
  ctx.fillRect(12, 28, 8, 4);
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(12, 14, 8, 4);
  
  // Badge/Medal
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(48, 16, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(40, 26, 16, 6);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '8px Arial';
  ctx.fillText('#1', 44, 20);
  
  // Picture frame with art
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(68, 4, 28, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(72, 8, 20, 20);
  ctx.fillStyle = '#4682B4';
  ctx.fillRect(74, 10, 16, 10);
  ctx.fillStyle = '#90EE90';
  ctx.fillRect(74, 20, 16, 6);
  
  // Velvet rope barrier
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(104, 8, 4, 24);
  ctx.fillRect(120, 8, 4, 24);
  ctx.fillStyle = '#DC143C';
  ctx.strokeStyle = '#DC143C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(106, 16);
  ctx.quadraticCurveTo(114, 20, 122, 16);
  ctx.stroke();
  
  return canvas.toBuffer('image/png');
}

// Save all spritesheets
console.log('🎨 Generating RPG-style sprites...');

fs.writeFileSync('public/assets/sprites/tileset.png', createRPGTileset());
console.log('✅ Created tileset.png');

fs.writeFileSync('public/assets/sprites/characters.png', createRPGCharacterSpritesheet());
console.log('✅ Created characters.png');

fs.writeFileSync('public/assets/sprites/decorations.png', createDecorationsSpritesheet());
console.log('✅ Created decorations.png');

console.log('\n🎮 RPG-style sprites generated successfully!');
console.log('🏛️ Your exhibition hall metaverse will now look like a cute RPG game!');
