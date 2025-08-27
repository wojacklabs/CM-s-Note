const fs = require('fs');
const path = require('path');

const mapPath = path.join('public', 'workadventure-map', 'cmnotes-townhall.json');
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

console.log('🔍 Verifying tile indices...\n');

// Check tileset info
const tileset = mapData.tilesets[0];
console.log('Tileset info:');
console.log(`- Name: ${tileset.name}`);
console.log(`- Tile count: ${tileset.tilecount}`);
console.log(`- First GID: ${tileset.firstgid}`);
console.log(`- Image size: ${tileset.imagewidth}x${tileset.imageheight}`);
console.log(`- Calculated tiles: ${(tileset.imagewidth/32) * (tileset.imageheight/32)}`);

// Find all tile indices used in map
const allTiles = new Set();
mapData.layers.forEach(layer => {
  if (layer.data) {
    layer.data.forEach(tile => {
      if (tile > 0) allTiles.add(tile);
    });
  }
});

const sortedTiles = Array.from(allTiles).sort((a, b) => a - b);
console.log(`\nTotal unique tiles used: ${sortedTiles.length}`);
console.log(`Tile range: ${sortedTiles[0]} - ${sortedTiles[sortedTiles.length - 1]}`);

// Check for out-of-range tiles
const maxTileId = tileset.tilecount;
const outOfRange = sortedTiles.filter(tile => tile > maxTileId);
if (outOfRange.length > 0) {
  console.log(`\n❌ ERROR: Found ${outOfRange.length} tiles out of range (> ${maxTileId}):`);
  console.log(outOfRange);
} else {
  console.log(`\n✅ All tiles are within range (1-${maxTileId})`);
}

// Check sprite tiles
console.log('\nSprite tile range check:');
const spriteTiles = sortedTiles.filter(t => t >= 60 && t <= 107);
console.log(`Found ${spriteTiles.length} sprite tiles: ${spriteTiles[0]}-${spriteTiles[spriteTiles.length-1]}`);

// Check iryslogo tiles
console.log('\nIryslogo tile range check:');
const iryslogoTiles = sortedTiles.filter(t => t >= 110 && t <= 125);
console.log(`Found ${iryslogoTiles.length} iryslogo tiles: ${iryslogoTiles[0]}-${iryslogoTiles[iryslogoTiles.length-1]}`);

// Check decoration layer specifically
const decorLayer = mapData.layers.find(l => l.name === 'decoration');
if (decorLayer) {
  const decorTiles = decorLayer.data.filter(t => t > 0);
  const maxDecorTile = Math.max(...decorTiles);
  console.log(`\nDecoration layer max tile: ${maxDecorTile}`);
  
  // Find problematic tiles
  const problemTiles = decorTiles.filter(t => t > maxTileId);
  if (problemTiles.length > 0) {
    console.log(`\n❌ Problematic tiles in decoration layer:`);
    decorLayer.data.forEach((tile, index) => {
      if (tile > maxTileId) {
        const x = index % decorLayer.width;
        const y = Math.floor(index / decorLayer.width);
        console.log(`  Position (${x},${y}): tile ${tile}`);
      }
    });
  }
}
