const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function verifyTileset() {
  console.log('🔍 Verifying tileset generation...\n');
  
  // Load tileset
  const tilesetPath = path.join('public', 'workadventure-map', 'cmnotes-tileset.png');
  const tilesetImage = await loadImage(tilesetPath);
  
  console.log(`Tileset size: ${tilesetImage.width}x${tilesetImage.height}`);
  console.log(`Total rows: ${tilesetImage.height / 32}`);
  console.log(`Tiles per row: ${tilesetImage.width / 32}`);
  console.log(`Total tiles: ${(tilesetImage.width / 32) * (tilesetImage.height / 32)}`);
  
  // Create a debug image showing tile numbers
  const debugCanvas = createCanvas(tilesetImage.width, tilesetImage.height);
  const ctx = debugCanvas.getContext('2d');
  
  // Draw the tileset
  ctx.drawImage(tilesetImage, 0, 0);
  
  // Add tile numbers
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let tileIndex = 0;
  for (let y = 0; y < tilesetImage.height; y += 32) {
    for (let x = 0; x < tilesetImage.width; x += 32) {
      // Add semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y, 30, 15);
      
      // Add tile number
      ctx.fillStyle = '#00ff00';
      ctx.fillText(tileIndex.toString(), x + 16, y + 8);
      
      tileIndex++;
    }
  }
  
  // Save debug image
  const debugPath = path.join('public', 'workadventure-map', 'tileset-debug.png');
  const buffer = debugCanvas.toBuffer('image/png');
  fs.writeFileSync(debugPath, buffer);
  
  console.log(`\n✅ Debug tileset saved to: ${debugPath}`);
  console.log('📌 Tile 52: Sprite marker');
  console.log('📌 Tiles 53-100: Sprite image (8x6)');
  console.log('📌 Tiles 101-116: Iryslogo image (4x4)');
}

verifyTileset().catch(console.error);
