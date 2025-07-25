const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function checkImages() {
  // Check sprite-resized.png
  const spriteResizedPath = path.join('public', 'workadventure-map', 'sprite-resized.png');
  if (fs.existsSync(spriteResizedPath)) {
    const spriteImage = await loadImage(spriteResizedPath);
    console.log('sprite-resized.png:');
    console.log(`  - Size: ${spriteImage.width}x${spriteImage.height} pixels`);
    console.log(`  - Tiles: ${spriteImage.width/32}x${spriteImage.height/32} (32px per tile)`);
    console.log(`  - Total tiles: ${(spriteImage.width/32) * (spriteImage.height/32)}`);
  }

  // Check iryslogo.png
  const iryslogoPath = path.join('public', 'workadventure-map', 'iryslogo.png');
  if (fs.existsSync(iryslogoPath)) {
    const irysImage = await loadImage(iryslogoPath);
    console.log('\niryslogo.png:');
    console.log(`  - Size: ${irysImage.width}x${irysImage.height} pixels`);
    console.log(`  - Tiles: ${irysImage.width/32}x${irysImage.height/32} (32px per tile)`);
    console.log(`  - Total tiles: ${(irysImage.width/32) * (irysImage.height/32)}`);
  }
}

checkImages().catch(console.error);
