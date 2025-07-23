const fs = require('fs');
const path = require('path');

const mapPath = path.join('public', 'workadventure-map', 'cmnotes-townhall.json');
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

// Find decoration layer
const decorLayer = mapData.layers.find(layer => layer.name === 'decoration');
if (decorLayer) {
  const data = decorLayer.data;
  const width = decorLayer.width;
  const height = decorLayer.height;
  
  console.log('🔍 Analyzing decoration layer tiles...\n');
  
  // Find sprite tiles (53-100)
  let spriteFound = false;
  let spritePositions = [];
  
  // Find iryslogo tiles (101-116)
  let iryslogoFound = false;
  let iryslogoPositions = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const tileId = data[index];
      
      if (tileId >= 53 && tileId <= 100) {
        spriteFound = true;
        spritePositions.push({x, y, tileId});
      }
      
      if (tileId >= 101 && tileId <= 116) {
        iryslogoFound = true;
        iryslogoPositions.push({x, y, tileId});
      }
    }
  }
  
  console.log(`Sprite tiles (53-100): ${spriteFound ? '✅ Found' : '❌ Not found'}`);
  if (spritePositions.length > 0) {
    console.log(`  - Count: ${spritePositions.length} tiles`);
    console.log(`  - First tile: ${JSON.stringify(spritePositions[0])}`);
    console.log(`  - Last tile: ${JSON.stringify(spritePositions[spritePositions.length - 1])}`);
  }
  
  console.log(`\nIryslogo tiles (101-116): ${iryslogoFound ? '✅ Found' : '❌ Not found'}`);
  if (iryslogoPositions.length > 0) {
    console.log(`  - Count: ${iryslogoPositions.length} tiles`);
    console.log(`  - First tile: ${JSON.stringify(iryslogoPositions[0])}`);
    console.log(`  - Last tile: ${JSON.stringify(iryslogoPositions[iryslogoPositions.length - 1])}`);
  }
  
  // Check for any unusual tile IDs
  const unusualTiles = new Set();
  data.forEach(tileId => {
    if (tileId > 120) {
      unusualTiles.add(tileId);
    }
  });
  
  if (unusualTiles.size > 0) {
    console.log('\n⚠️  Unusual tile IDs found (> 120):', Array.from(unusualTiles).sort());
  }
}
