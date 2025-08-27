const fs = require('fs');

console.log('🔍 Analyzing tile positions in tileset...\n');

// Sprite tiles: 60-107
console.log('Sprite tiles (60-107):');
for (let i = 60; i <= 107; i++) {
  const col = i % 10;
  const row = Math.floor(i / 10);
  console.log(`Tile ${i}: Row ${row}, Col ${col} (tileset position: ${col * 32}, ${row * 32})`);
  if ((i - 60 + 1) % 8 === 0) {
    console.log('  ^ This is the last tile in sprite row');
  }
}

console.log('\nIryslogo tiles (110-125):');
for (let i = 110; i <= 125; i++) {
  const col = i % 10;
  const row = Math.floor(i / 10);
  console.log(`Tile ${i}: Row ${row}, Col ${col} (tileset position: ${col * 32}, ${row * 32})`);
  if ((i - 110 + 1) % 4 === 0) {
    console.log('  ^ This is the last tile in iryslogo row');
  }
}

console.log('\n⚠️  Potential issue:');
console.log('Sprite spans from column 0 to 7 in each row');
console.log('Tile 67 is at col 7 (last column of row 6)');
console.log('Tile 68 is at col 8 (wraps within same row)');
console.log('This could cause rendering issues if the engine expects continuous tiles.');

console.log('\n💡 Solution: Ensure sprite starts at column 0 and doesn\'t wrap within rows');
