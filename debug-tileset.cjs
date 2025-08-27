const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function debugTileset() {
  // Load the generated tileset
  const tilesetPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.png');
  const tileset = await loadImage(tilesetPath);
  
  // Create a debug canvas
  const canvas = createCanvas(1280, 800);
  const ctx = canvas.getContext('2d');
  
  // Black background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1280, 800);
  
  // Draw sprite tiles (53-100)
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText('Sprite tiles (53-100) - 8x6 grid:', 10, 20);
  
  let x = 10, y = 40;
  for (let i = 0; i < 48; i++) {
    const tileIndex = 53 + i;
    const srcX = ((tileIndex) % 10) * 32;
    const srcY = Math.floor((tileIndex) / 10) * 32;
    
    // Draw tile
    ctx.drawImage(tileset, srcX, srcY, 32, 32, x, y, 32, 32);
    
    // Draw tile number
    ctx.fillStyle = '#0f0';
    ctx.font = '10px sans-serif';
    ctx.fillText(tileIndex.toString(), x + 2, y + 10);
    
    x += 35;
    if ((i + 1) % 8 === 0) {
      x = 10;
      y += 35;
    }
  }
  
  // Draw iryslogo tiles (101-116)
  y += 50;
  x = 10;
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText('Iryslogo tiles (101-116) - 4x4 grid:', x, y);
  
  y += 20;
  for (let i = 0; i < 16; i++) {
    const tileIndex = 101 + i;
    const srcX = ((tileIndex) % 10) * 32;
    const srcY = Math.floor((tileIndex) / 10) * 32;
    
    // Draw tile
    ctx.drawImage(tileset, srcX, srcY, 32, 32, x, y, 32, 32);
    
    // Draw tile number
    ctx.fillStyle = '#0f0';
    ctx.font = '10px sans-serif';
    ctx.fillText(tileIndex.toString(), x + 2, y + 10);
    
    x += 35;
    if ((i + 1) % 4 === 0) {
      x = 10;
      y += 35;
    }
  }
  
  // Save debug image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('tileset-debug.png', buffer);
  console.log('Debug image saved as tileset-debug.png');
  
  // Also check the actual position in tileset
  console.log('\nTile positions in tileset:');
  console.log('Tile 53: x=' + ((53) % 10) * 32 + ', y=' + Math.floor((53) / 10) * 32);
  console.log('Tile 100: x=' + ((100) % 10) * 32 + ', y=' + Math.floor((100) / 10) * 32);
  console.log('Tile 101: x=' + ((101) % 10) * 32 + ', y=' + Math.floor((101) / 10) * 32);
  console.log('Tile 116: x=' + ((116) % 10) * 32 + ', y=' + Math.floor((116) / 10) * 32);
}

debugTileset().catch(console.error);
