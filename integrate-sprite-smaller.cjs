const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function integrateSmallerSprite() {
  console.log('🎨 Integrating sprite.png with smaller size...\n');

  const TILE_SIZE = 32;
  const TILES_PER_ROW = 10;
  
  // Load sprite image
  const spritePath = path.join('public', 'workadventure-map', 'sprite.png');
  const spriteImage = await loadImage(spritePath);
  
  console.log(`Original sprite size: ${spriteImage.width}x${spriteImage.height}px`);
  
  // First, regenerate the base cyberpunk tileset
  const { execSync } = require('child_process');
  execSync('node generate-cmnotes-tileset-cyberpunk.cjs');
  
  // Load the fresh tileset
  const tilesetPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.png');
  const baseImage = await loadImage(tilesetPath);
  
  // Make sprite smaller - 8x12 tiles instead of 10x15
  const spriteWidthInTiles = 8;
  const spriteHeightInTiles = 12;
  const spriteWidth = spriteWidthInTiles * TILE_SIZE; // 256px
  const spriteHeight = spriteHeightInTiles * TILE_SIZE; // 384px
  
  console.log(`Target sprite size: ${spriteWidth}x${spriteHeight}px (${spriteWidthInTiles}x${spriteHeightInTiles} tiles)`);
  
  // Calculate new canvas height
  const totalSpriteTiles = spriteWidthInTiles * spriteHeightInTiles; // 96 tiles
  const existingTiles = 52; // 0-51
  const totalTiles = existingTiles + totalSpriteTiles;
  const totalRows = Math.ceil(totalTiles / TILES_PER_ROW);
  const newHeight = totalRows * TILE_SIZE;
  
  const canvas = createCanvas(baseImage.width, newHeight);
  const ctx = canvas.getContext('2d');
  
  // Draw base tileset
  ctx.drawImage(baseImage, 0, 0);
  
  // Create a temporary canvas to resize sprite
  const tempCanvas = createCanvas(spriteWidth, spriteHeight);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';
  tempCtx.drawImage(spriteImage, 0, 0, spriteWidth, spriteHeight);
  
  // Split sprite into tiles and add to tileset
  let tileIndex = 52;
  for (let sy = 0; sy < spriteHeightInTiles; sy++) {
    for (let sx = 0; sx < spriteWidthInTiles; sx++) {
      const row = Math.floor(tileIndex / TILES_PER_ROW);
      const col = tileIndex % TILES_PER_ROW;
      
      const srcX = sx * TILE_SIZE;
      const srcY = sy * TILE_SIZE;
      const destX = col * TILE_SIZE;
      const destY = row * TILE_SIZE;
      
      // Copy tile from sprite to tileset
      ctx.drawImage(
        tempCanvas,
        srcX, srcY, TILE_SIZE, TILE_SIZE,
        destX, destY, TILE_SIZE, TILE_SIZE
      );
      
      tileIndex++;
    }
  }
  
  // Save updated tileset
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(tilesetPath, buffer);
  
  console.log('✅ Sprite integrated with smaller size!');
  console.log(`📍 Sprite tiles: 52 to ${51 + totalSpriteTiles}`);
  console.log(`📐 Sprite size in tileset: ${spriteWidthInTiles}x${spriteHeightInTiles} tiles`);
  console.log(`📏 Total tiles in tileset: ${totalTiles}`);
  
  return {
    startTile: 52,
    width: spriteWidthInTiles,
    height: spriteHeightInTiles,
    totalTiles: totalSpriteTiles,
    endTile: 51 + totalSpriteTiles
  };
}

integrateSmallerSprite().catch(console.error);
