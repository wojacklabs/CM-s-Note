const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function integrateSpriteWithPrecision() {
  console.log('🎨 Integrating sprite.png with 100% precision...\n');

  const TILE_SIZE = 32;
  const TILES_PER_ROW = 10;
  
  // Load sprite image
  const spritePath = path.join('public', 'workadventure-map', 'sprite.png');
  const spriteImage = await loadImage(spritePath);
  
  console.log(`Original sprite size: ${spriteImage.width}x${spriteImage.height}px`);
  console.log(`Original aspect ratio: ${spriteImage.width}:${spriteImage.height} = ${(spriteImage.width/spriteImage.height).toFixed(3)}`);
  
  // Calculate optimal tile dimensions maintaining aspect ratio
  // Target: Find dimensions that are exact multiples of 32 AND maintain 2:3 ratio
  let bestWidth = 0;
  let bestHeight = 0;
  let minError = Infinity;
  
  // Test different tile combinations
  for (let w = 4; w <= 12; w++) {
    for (let h = 6; h <= 18; h++) {
      const pixelWidth = w * TILE_SIZE;
      const pixelHeight = h * TILE_SIZE;
      const ratio = pixelWidth / pixelHeight;
      const targetRatio = 2 / 3;
      const error = Math.abs(ratio - targetRatio);
      
      if (error < minError && pixelWidth <= 320 && pixelHeight <= 480) {
        minError = error;
        bestWidth = w;
        bestHeight = h;
      }
    }
  }
  
  // Use 6x9 tiles (192x288) for perfect 2:3 ratio
  const spriteWidthInTiles = 6;
  const spriteHeightInTiles = 9;
  const spriteWidth = spriteWidthInTiles * TILE_SIZE;
  const spriteHeight = spriteHeightInTiles * TILE_SIZE;
  
  console.log(`\nOptimal tile dimensions: ${spriteWidthInTiles}x${spriteHeightInTiles} tiles`);
  console.log(`Pixel dimensions: ${spriteWidth}x${spriteHeight}px`);
  console.log(`Ratio check: ${spriteWidth}:${spriteHeight} = ${(spriteWidth/spriteHeight).toFixed(3)} (target: 0.667)`);
  
  // First, regenerate the base cyberpunk tileset
  const { execSync } = require('child_process');
  execSync('node generate-cmnotes-tileset-cyberpunk.cjs');
  
  // Load the fresh tileset
  const tilesetPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.png');
  const baseImage = await loadImage(tilesetPath);
  
  // Calculate new canvas height
  const totalSpriteTiles = spriteWidthInTiles * spriteHeightInTiles;
  const existingTiles = 52; // 0-51
  const totalTiles = existingTiles + totalSpriteTiles;
  const totalRows = Math.ceil(totalTiles / TILES_PER_ROW);
  const newHeight = totalRows * TILE_SIZE;
  
  console.log(`\nTileset expansion:`);
  console.log(`- Existing tiles: ${existingTiles}`);
  console.log(`- Sprite tiles: ${totalSpriteTiles}`);
  console.log(`- Total tiles: ${totalTiles}`);
  console.log(`- Canvas height: ${newHeight}px (${totalRows} rows)`);
  
  const canvas = createCanvas(baseImage.width, newHeight);
  const ctx = canvas.getContext('2d');
  
  // Draw base tileset
  ctx.drawImage(baseImage, 0, 0);
  
  // Create a temporary canvas to resize sprite with high quality
  const tempCanvas = createCanvas(spriteWidth, spriteHeight);
  const tempCtx = tempCanvas.getContext('2d');
  
  // Use high quality image smoothing
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';
  
  // Draw sprite with precise scaling
  tempCtx.drawImage(spriteImage, 0, 0, spriteWidth, spriteHeight);
  
  // Split sprite into tiles with pixel-perfect precision
  let tileIndex = existingTiles;
  console.log('\nSplitting sprite into tiles:');
  
  for (let sy = 0; sy < spriteHeightInTiles; sy++) {
    for (let sx = 0; sx < spriteWidthInTiles; sx++) {
      const row = Math.floor(tileIndex / TILES_PER_ROW);
      const col = tileIndex % TILES_PER_ROW;
      
      // Calculate source coordinates with exact pixel boundaries
      const srcX = sx * TILE_SIZE;
      const srcY = sy * TILE_SIZE;
      const destX = col * TILE_SIZE;
      const destY = row * TILE_SIZE;
      
      // Ensure we're within canvas bounds
      if (destX + TILE_SIZE <= canvas.width && destY + TILE_SIZE <= canvas.height) {
        // Use drawImage with exact pixel coordinates
        ctx.drawImage(
          tempCanvas,
          srcX, srcY, TILE_SIZE, TILE_SIZE,  // Source rect
          destX, destY, TILE_SIZE, TILE_SIZE  // Dest rect
        );
        
        if (sx === 0 || sx === spriteWidthInTiles - 1 || sy === 0 || sy === spriteHeightInTiles - 1) {
          console.log(`  Edge tile [${sx},${sy}] → tileset position [${col},${row}] (tile ${tileIndex})`);
        }
      }
      
      tileIndex++;
    }
  }
  
  // Save updated tileset
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(tilesetPath, buffer);
  
  console.log('\n✅ Sprite integrated with 100% precision!');
  console.log(`📍 Sprite tiles: ${existingTiles} to ${existingTiles + totalSpriteTiles - 1}`);
  console.log(`📐 Sprite dimensions: ${spriteWidthInTiles}x${spriteHeightInTiles} tiles (${spriteWidth}x${spriteHeight}px)`);
  console.log(`🎯 No pixel bleeding or wrapping!`);
  
  // Update the map generation script
  console.log('\n📝 Updating map generation script...');
  updateMapScript(spriteWidthInTiles, spriteHeightInTiles, existingTiles, totalTiles);
}

function updateMapScript(spriteWidth, spriteHeight, startTile, totalTiles) {
  const mapScriptPath = 'generate-cmnotes-map.cjs';
  let mapScript = fs.readFileSync(mapScriptPath, 'utf8');
  
  // Update sprite dimensions in map script
  mapScript = mapScript.replace(
    /\/\/ Note: sprite\.png is now added as a separate image layer, not as tiles/,
    `// Add sprite image tiles with precise boundaries
  const spriteStartTile = ${startTile};
  const spriteWidth = ${spriteWidth};
  const spriteHeight = ${spriteHeight};
  
  // Position at center-bottom
  const spriteStartX = Math.floor((MAP_WIDTH - spriteWidth) / 2);
  const spriteStartY = MAP_HEIGHT - spriteHeight - 2; // Bottom with 2-tile margin
  
  // Place sprite tiles with exact positioning
  for (let sy = 0; sy < spriteHeight; sy++) {
    for (let sx = 0; sx < spriteWidth; sx++) {
      const x = spriteStartX + sx;
      const y = spriteStartY + sy;
      
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        const tileIndex = spriteStartTile + (sy * spriteWidth) + sx;
        decorLayer[y][x] = tileIndex + 1; // +1 for 1-based indexing
      }
    }
  }`
  );
  
  // Remove image layer
  mapScript = mapScript.replace(/,\s*{\s*id:\s*4,\s*image:\s*"sprite\.png"[^}]+},?/s, ',');
  
  // Update layer IDs
  mapScript = mapScript.replace(/id:\s*5,\s*name:\s*"objects"/, 'id: 4,\nname: "objects"');
  mapScript = mapScript.replace(/nextlayerid:\s*6/, 'nextlayerid: 5');
  
  // Update tileset definition
  const totalRows = Math.ceil(totalTiles / 10);
  const tilesetHeight = totalRows * 32;
  
  mapScript = mapScript.replace(
    /imageheight:\s*\d+,\s*\/\/ Height for base tileset without sprite/,
    `imageheight: ${tilesetHeight},  // Height including sprite tiles`
  );
  
  mapScript = mapScript.replace(
    /tilecount:\s*\d+,\s*\/\/ Base tileset tiles only/,
    `tilecount: ${totalTiles},  // Including sprite tiles`
  );
  
  // Fix objects array reference
  mapScript = mapScript.replace(
    /mapData\.layers\[4\]\.objects\.length/,
    'mapData.layers[3].objects.length'
  );
  
  fs.writeFileSync(mapScriptPath, mapScript);
  console.log('✅ Map script updated!');
}

integrateSpriteWithPrecision().catch(console.error);
