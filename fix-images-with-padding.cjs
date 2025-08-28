const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function fixImagesWithPadding() {
  console.log('🔧 Fixing images to ensure perfect tile alignment...\n');
  
  // Fix sprite-resized.png
  const spritePath = path.join('public', 'workadventure-map', 'sprite-resized.png');
  const spriteImage = await loadImage(spritePath);
  
  // Create new canvas with exact tile dimensions
  const spriteCanvas = createCanvas(256, 192); // 8x6 tiles
  const spriteCtx = spriteCanvas.getContext('2d');
  
  // Fill with transparent background first
  spriteCtx.clearRect(0, 0, 256, 192);
  
  // Draw sprite centered with 2px padding on all sides
  const padding = 2;
  spriteCtx.drawImage(
    spriteImage, 
    0, 0, spriteImage.width, spriteImage.height,
    padding, padding, 256 - padding * 2, 192 - padding * 2
  );
  
  // Save fixed sprite
  const spriteBuffer = spriteCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join('public', 'workadventure-map', 'sprite-fixed.png'), spriteBuffer);
  console.log('✅ Created sprite-fixed.png with proper padding');
  
  // Fix iryslogo.png
  const iryslogoPath = path.join('public', 'workadventure-map', 'iryslogo.png');
  const iryslogoImage = await loadImage(iryslogoPath);
  
  // Create new canvas with exact tile dimensions
  const irysCanvas = createCanvas(128, 128); // 4x4 tiles
  const irysCtx = irysCanvas.getContext('2d');
  
  // Fill with transparent background
  irysCtx.clearRect(0, 0, 128, 128);
  
  // Draw logo with slight padding to prevent edge cutting
  irysCtx.drawImage(
    iryslogoImage,
    0, 0, iryslogoImage.width, iryslogoImage.height,
    padding, padding, 128 - padding * 2, 128 - padding * 2
  );
  
  // Save fixed iryslogo
  const irysBuffer = irysCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join('public', 'workadventure-map', 'iryslogo-fixed.png'), irysBuffer);
  console.log('✅ Created iryslogo-fixed.png with proper padding');
  
  console.log('\n📝 Next steps:');
  console.log('1. Update generate-cmnotes-tileset-cyberpunk.cjs to use sprite-fixed.png and iryslogo-fixed.png');
  console.log('2. Regenerate the tileset and map');
  console.log('\nThe padding ensures images won\'t be cut off at tile boundaries.');
}

fixImagesWithPadding().catch(console.error);
