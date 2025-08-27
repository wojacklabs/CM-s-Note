const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function debugTileGeneration() {
  console.log('🔍 Debugging tile generation...\n');
  
  // Load sprite and iryslogo
  const spritePath = path.join('public', 'workadventure-map', 'sprite-resized.png');
  const iryslogoPath = path.join('public', 'workadventure-map', 'iryslogo.png');
  
  const spriteImage = await loadImage(spritePath);
  const iryslogoImage = await loadImage(iryslogoPath);
  
  // Create debug canvas
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 800, 600);
  
  // Draw original sprite
  ctx.fillStyle = '#000';
  ctx.font = '14px sans-serif';
  ctx.fillText('Original sprite-resized.png (256x192):', 10, 20);
  ctx.drawImage(spriteImage, 10, 30);
  
  // Draw sprite tiles as they would be cut
  ctx.fillText('Sprite tiles (8x6 grid):', 300, 20);
  let x = 300, y = 30;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 8; col++) {
      // Draw tile with border
      ctx.strokeStyle = '#f00';
      ctx.strokeRect(x + col * 33, y + row * 33, 32, 32);
      
      // Draw tile content
      ctx.drawImage(
        spriteImage,
        col * 32, row * 32, 32, 32,  // source
        x + col * 33, y + row * 33, 32, 32  // dest
      );
      
      // Add tile number
      ctx.fillStyle = '#00f';
      ctx.font = '10px sans-serif';
      ctx.fillText((row * 8 + col).toString(), x + col * 33 + 2, y + row * 33 + 10);
    }
  }
  
  // Draw original iryslogo
  ctx.fillStyle = '#000';
  ctx.font = '14px sans-serif';
  ctx.fillText('Original iryslogo.png (128x128):', 10, 250);
  ctx.drawImage(iryslogoImage, 10, 260);
  
  // Draw iryslogo tiles
  ctx.fillText('Iryslogo tiles (4x4 grid):', 300, 250);
  x = 300;
  y = 260;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      // Draw tile with border
      ctx.strokeStyle = '#f00';
      ctx.strokeRect(x + col * 33, y + row * 33, 32, 32);
      
      // Draw tile content
      ctx.drawImage(
        iryslogoImage,
        col * 32, row * 32, 32, 32,  // source
        x + col * 33, y + row * 33, 32, 32  // dest
      );
      
      // Add tile number
      ctx.fillStyle = '#00f';
      ctx.font = '10px sans-serif';
      ctx.fillText((row * 4 + col).toString(), x + col * 33 + 2, y + row * 33 + 10);
    }
  }
  
  // Check if last column is being cut
  ctx.fillStyle = '#f00';
  ctx.font = '12px sans-serif';
  ctx.fillText('Last column of sprite (col 7): x=' + (7 * 32) + ' to ' + (8 * 32) + ' (should be 224-256)', 10, 450);
  ctx.fillText('Last column of iryslogo (col 3): x=' + (3 * 32) + ' to ' + (4 * 32) + ' (should be 96-128)', 10, 470);
  
  // Save debug image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('debug-tile-generation.png', buffer);
  console.log('✅ Debug image saved as debug-tile-generation.png');
  
  // Also check tileset generation
  const tilesetPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.png');
  const tileset = await loadImage(tilesetPath);
  
  // Create another debug canvas for tileset
  const tilesetCanvas = createCanvas(800, 600);
  const tilesetCtx = tilesetCanvas.getContext('2d');
  
  tilesetCtx.fillStyle = '#fff';
  tilesetCtx.fillRect(0, 0, 800, 600);
  
  // Draw sprite tiles from tileset
  tilesetCtx.fillStyle = '#000';
  tilesetCtx.font = '14px sans-serif';
  tilesetCtx.fillText('Sprite tiles from tileset (60-107):', 10, 20);
  
  let dx = 10, dy = 40;
  for (let i = 60; i <= 107; i++) {
    const srcX = (i % 10) * 32;
    const srcY = Math.floor(i / 10) * 32;
    
    tilesetCtx.drawImage(tileset, srcX, srcY, 32, 32, dx, dy, 32, 32);
    tilesetCtx.strokeStyle = '#00f';
    tilesetCtx.strokeRect(dx, dy, 32, 32);
    
    tilesetCtx.fillStyle = '#f00';
    tilesetCtx.font = '8px sans-serif';
    tilesetCtx.fillText(i.toString(), dx + 2, dy + 10);
    
    dx += 33;
    if ((i - 59) % 8 === 0) {
      dx = 10;
      dy += 33;
    }
  }
  
  // Save tileset debug image
  const tilesetBuffer = tilesetCanvas.toBuffer('image/png');
  fs.writeFileSync('debug-tileset-extraction.png', tilesetBuffer);
  console.log('✅ Tileset debug image saved as debug-tileset-extraction.png');
}

debugTileGeneration().catch(console.error);
