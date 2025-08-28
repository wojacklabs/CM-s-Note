const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function analyzeTilesetLayout() {
  console.log('🔍 Analyzing tileset layout...\n');
  
  // Sprite tiles: 60-107 (48 tiles, 8x6)
  console.log('Sprite layout (60-107):');
  console.log('Expected: 8 tiles per row, 6 rows');
  console.log('Actual tileset layout:');
  
  for (let i = 60; i <= 107; i++) {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const spriteRow = Math.floor((i - 60) / 8);
    const spriteCol = (i - 60) % 8;
    
    console.log(`Tile ${i}: Tileset[${row},${col}] = Sprite[${spriteRow},${spriteCol}]`);
    
    if (col === 9) {
      console.log('  ^ Row boundary in tileset');
    }
    if (spriteCol === 7) {
      console.log('  ^ Last column of sprite row');
    }
  }
  
  console.log('\n🚨 Problem identified:');
  console.log('Sprite is 8 tiles wide, but tileset is 10 tiles wide');
  console.log('This causes misalignment when tiles wrap to next row');
  
  console.log('\n💡 Solution:');
  console.log('When generating tileset, we need to place sprite tiles correctly');
  console.log('accounting for the different widths.');
  
  // Visual representation
  const canvas = createCanvas(400, 300);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 400, 300);
  
  // Draw tileset grid
  ctx.strokeStyle = '#ccc';
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#000';
  ctx.fillText('Tileset Grid (10x13):', 10, 20);
  
  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 10; x++) {
      const px = 10 + x * 20;
      const py = 30 + y * 20;
      ctx.strokeRect(px, py, 20, 20);
      ctx.fillText((y * 10 + x).toString(), px + 2, py + 15);
    }
  }
  
  // Highlight sprite tiles
  ctx.strokeStyle = '#f00';
  ctx.lineWidth = 2;
  for (let i = 60; i <= 107; i++) {
    const x = i % 10;
    const y = Math.floor(i / 10);
    const px = 10 + x * 20;
    const py = 30 + y * 20;
    ctx.strokeRect(px, py, 20, 20);
  }
  
  // Draw expected sprite layout
  ctx.fillStyle = '#000';
  ctx.fillText('Expected Sprite (8x6):', 250, 20);
  ctx.strokeStyle = '#0f0';
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 8; x++) {
      const px = 250 + x * 20;
      const py = 30 + y * 20;
      ctx.strokeRect(px, py, 20, 20);
      ctx.fillText((y * 8 + x).toString(), px + 2, py + 15);
    }
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('tileset-layout-analysis.png', buffer);
  console.log('\n✅ Visual analysis saved as tileset-layout-analysis.png');
}

analyzeTilesetLayout().catch(console.error);
