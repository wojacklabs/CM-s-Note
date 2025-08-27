const fs = require('fs');
const path = require('path');

const mapPath = path.join('public', 'workadventure-map', 'cmnotes-townhall.json');
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

// Find decoration layer
const decorLayer = mapData.layers.find(layer => layer.name === 'decoration');

console.log('🔍 Checking tile arrangement in map...\n');

// Find sprite area
console.log('Sprite tiles (should be 60-107):');
let spriteArea = [];
for (let y = 20; y < 30; y++) {
  let row = [];
  for (let x = 10; x < 30; x++) {
    const index = y * 40 + x;
    const tile = decorLayer.data[index];
    if (tile >= 60 && tile <= 107) {
      row.push(tile.toString().padStart(3));
    } else {
      row.push('   ');
    }
  }
  if (row.some(t => t.trim())) {
    console.log(`Row ${y}: [${row.join(',')}]`);
  }
}

console.log('\nIryslogo tiles (should be 110-125):');
// Find iryslogo area
for (let y = 10; y < 20; y++) {
  let row = [];
  for (let x = 15; x < 25; x++) {
    const index = y * 40 + x;
    const tile = decorLayer.data[index];
    if (tile >= 110 && tile <= 125) {
      row.push(tile.toString().padStart(3));
    } else {
      row.push('   ');
    }
  }
  if (row.some(t => t.trim())) {
    console.log(`Row ${y}: [${row.join(',')}]`);
  }
}

// Check for wrapping issues
console.log('\nChecking for potential wrapping issues:');
const width = 40; // map width
for (let i = 0; i < decorLayer.data.length; i++) {
  const tile = decorLayer.data[i];
  if (tile >= 60 && tile <= 107) {
    const x = i % width;
    const y = Math.floor(i / width);
    const expectedTile = 60 + ((y - 22) * 8 + (x - 16));
    if (tile !== expectedTile && x >= 16 && x < 24 && y >= 22 && y < 28) {
      console.log(`Position (${x},${y}): Found tile ${tile}, expected ${expectedTile}`);
    }
  }
}
