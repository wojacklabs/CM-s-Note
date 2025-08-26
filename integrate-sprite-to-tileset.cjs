const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function integrateSpriteToTileset() {
  console.log('🎨 Integrating sprite.png into tileset...\n');

  const TILE_SIZE = 32;
  const TILES_PER_ROW = 10;
  
  // Load sprite image
  const spritePath = path.join('public', 'workadventure-map', 'sprite.png');
  const spriteImage = await loadImage(spritePath);
  
  // First, regenerate the base cyberpunk tileset
  const { execSync } = require('child_process');
  execSync('node generate-cmnotes-tileset-cyberpunk.cjs');
  
  // Load the fresh tileset
  const tilesetPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.png');
  const baseImage = await loadImage(tilesetPath);
  
  // Create canvas for combined tileset
  // Sprite will be 8x6 tiles (256x192px), starting at tile 53
  const spriteWidth = 256;
  const spriteHeight = 192;
  const spriteTilesX = spriteWidth / TILE_SIZE; // 8
  const spriteTilesY = spriteHeight / TILE_SIZE; // 6
  
  // Calculate new canvas height
  const extraRows = Math.ceil((spriteTilesX * spriteTilesY) / TILES_PER_ROW);
  const newHeight = baseImage.height + (extraRows * TILE_SIZE);
  
  const canvas = createCanvas(baseImage.width, newHeight);
  const ctx = canvas.getContext('2d');
  
  // Draw base tileset
  ctx.drawImage(baseImage, 0, 0);
  
  // Create a temporary canvas to resize sprite
  const tempCanvas = createCanvas(spriteWidth, spriteHeight);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(spriteImage, 0, 0, spriteWidth, spriteHeight);
  
  // Split sprite into tiles and add to tileset
  let tileIndex = 53; // Start after existing tiles
  for (let sy = 0; sy < spriteTilesY; sy++) {
    for (let sx = 0; sx < spriteTilesX; sx++) {
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
  
  console.log('✅ Sprite integrated into tileset!');
  console.log(`📍 Sprite tiles: 53 to ${52 + (spriteTilesX * spriteTilesY)}`);
  console.log(`📐 Sprite size: ${spriteTilesX}x${spriteTilesY} tiles`);
  
  // Return sprite tile mapping for use in map
  return {
    startTile: 53,
    width: spriteTilesX,
    height: spriteTilesY,
    totalTiles: spriteTilesX * spriteTilesY
  };
}

integrateSpriteToTileset().catch(console.error);
