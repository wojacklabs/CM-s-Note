// Debug tile placement for sprite and iryslogo

console.log('🔍 Debugging tile placement...\n');

console.log('Sprite tiles (8x6):');
for (let row = 0; row < 6; row++) {
  const tiles = [];
  for (let col = 0; col < 8; col++) {
    const tileIndex = 60 + (row * 10) + col;
    tiles.push(tileIndex);
  }
  console.log(`Row ${row}: tiles ${tiles.join(', ')}`);
}

console.log('\nIryslogo tiles (4x4):');
for (let row = 0; row < 4; row++) {
  const tiles = [];
  for (let col = 0; col < 4; col++) {
    const tileIndex = 110 + (row * 10) + col;
    tiles.push(tileIndex);
  }
  console.log(`Row ${row}: tiles ${tiles.join(', ')}`);
}

console.log('\n❌ Problem identified:');
console.log('Sprite row 5 uses tiles: 110, 111, 112, 113, 114, 115, 116, 117');
console.log('Iryslogo row 0 uses tiles: 110, 111, 112, 113');
console.log('These overlap!');

console.log('\n✅ Solution:');
console.log('Sprite should use rows 6-11 (tiles 60-117)');
console.log('Iryslogo should use rows 12-15 (tiles 120-153)');
