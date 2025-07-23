const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function resizeAndAddSprite() {
  console.log('🎨 Resizing and adding sprite to map...\n');

  const TILE_SIZE = 32;
  
  // Load sprite image
  const spritePath = path.join('public', 'workadventure-map', 'sprite.png');
  const spriteImage = await loadImage(spritePath);
  
  // Create resized sprite (256x192 = 8x6 tiles)
  const targetWidth = 256;  // 8 tiles
  const targetHeight = 192; // 6 tiles
  
  const resizeCanvas = createCanvas(targetWidth, targetHeight);
  const resizeCtx = resizeCanvas.getContext('2d');
  
  // Draw sprite resized
  resizeCtx.drawImage(spriteImage, 0, 0, targetWidth, targetHeight);
  
  // Save resized sprite
  const resizedPath = path.join('public', 'workadventure-map', 'sprite-resized.png');
  const buffer = resizeCanvas.toBuffer('image/png');
  fs.writeFileSync(resizedPath, buffer);
  
  console.log('✅ Sprite resized!');
  console.log(`📐 New size: ${targetWidth}x${targetHeight}px (${targetWidth/TILE_SIZE}x${targetHeight/TILE_SIZE} tiles)`);
  
  // Restore original tileset
  const { execSync } = require('child_process');
  execSync('node generate-cmnotes-tileset-cyberpunk.cjs');
  
  console.log('✅ Tileset restored!');
}

resizeAndAddSprite().catch(console.error);
