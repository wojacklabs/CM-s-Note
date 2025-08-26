const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function addSpriteToTileset() {
  console.log('🎨 Adding sprite.png to tileset...\n');

  const TILE_SIZE = 32;
  const TILES_PER_ROW = 10;
  
  // Load existing tileset
  const tilesetPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.png');
  const existingTileset = await loadImage(tilesetPath);
  
  // Load sprite image
  const spritePath = path.join('public', 'workadventure-map', 'sprite.png');
  const spriteImage = await loadImage(spritePath);
  
  // Calculate sprite dimensions in tiles
  const spriteTilesX = Math.ceil(spriteImage.width / TILE_SIZE);
  const spriteTilesY = Math.ceil(spriteImage.height / TILE_SIZE);
  
  console.log(`Sprite size: ${spriteImage.width}x${spriteImage.height}px`);
  console.log(`Sprite in tiles: ${spriteTilesX}x${spriteTilesY} tiles`);
  
  // Create new canvas with extra space for sprite
  const newHeight = existingTileset.height + (spriteTilesY * TILE_SIZE);
  const canvas = createCanvas(existingTileset.width, newHeight);
  const ctx = canvas.getContext('2d');
  
  // Copy existing tileset
  ctx.drawImage(existingTileset, 0, 0);
  
  // Add sprite at the bottom (tile index 60+)
  const spriteStartY = existingTileset.height;
  ctx.drawImage(spriteImage, 0, spriteStartY);
  
  // Save updated tileset
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(tilesetPath, buffer);
  
  console.log('✅ Sprite added to tileset!');
  console.log(`📍 Sprite starts at tile index: 60`);
  console.log(`📐 Sprite tile range: 60 to ${60 + (spriteTilesX * spriteTilesY) - 1}`);
  
  // Return sprite info for map generation
  return {
    startIndex: 60,
    tilesX: spriteTilesX,
    tilesY: spriteTilesY
  };
}

addSpriteToTileset().catch(console.error);
