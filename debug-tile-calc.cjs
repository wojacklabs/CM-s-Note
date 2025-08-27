console.log('🔍 Debugging tile calculation...\n');

const iryslogoStartTile = 110;
const iryslogoWidth = 4;
const iryslogoHeight = 4;

console.log('Expected iryslogo tiles:');
for (let iy = 0; iy < iryslogoHeight; iy++) {
  for (let ix = 0; ix < iryslogoWidth; ix++) {
    const tilesetRow = Math.floor(iryslogoStartTile / 10) + iy;
    const tilesetCol = (iryslogoStartTile % 10) + ix;
    const tileIndex = tilesetRow * 10 + tilesetCol;
    
    console.log(`Position (${ix},${iy}):`);
    console.log(`  - Start tile: ${iryslogoStartTile}`);
    console.log(`  - Tileset row: ${Math.floor(iryslogoStartTile / 10)} + ${iy} = ${tilesetRow}`);
    console.log(`  - Tileset col: ${iryslogoStartTile % 10} + ${ix} = ${tilesetCol}`);
    console.log(`  - Tile index: ${tilesetRow} * 10 + ${tilesetCol} = ${tileIndex}`);
    
    if (tilesetCol >= 10) {
      console.log(`  ⚠️  WARNING: Column overflow! ${tilesetCol} >= 10`);
    }
  }
  console.log();
}
