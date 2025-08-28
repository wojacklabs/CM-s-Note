const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function debugImagePlacement() {
  console.log('🔍 Debugging image placement in tileset...\n');
  
  // Load images
  const spritePath = path.join('public', 'workadventure-map', 'sprite-resized.png');
  const iryslogoPath = path.join('public', 'workadventure-map', 'iryslogo.png');
  
  const spriteImage = await loadImage(spritePath);
  const iryslogoImage = await loadImage(iryslogoPath);
  
  console.log('Original image sizes:');
  console.log(`  sprite-resized.png: ${spriteImage.width}x${spriteImage.height}`);
  console.log(`  iryslogo.png: ${iryslogoImage.width}x${iryslogoImage.height}`);
  
  // Create test canvas to check if images have transparency issues
  const testCanvas = createCanvas(400, 300);
  const ctx = testCanvas.getContext('2d');
  
  // Draw checkered background
  for (let y = 0; y < 300; y += 10) {
    for (let x = 0; x < 400; x += 10) {
      ctx.fillStyle = ((x/10 + y/10) % 2 === 0) ? '#fff' : '#ccc';
      ctx.fillRect(x, y, 10, 10);
    }
  }
  
  // Draw images to check boundaries
  ctx.drawImage(spriteImage, 10, 10);
  ctx.drawImage(iryslogoImage, 10, 220);
  
  // Draw red border around expected image boundaries
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, spriteImage.width, spriteImage.height);
  ctx.strokeRect(10, 220, iryslogoImage.width, iryslogoImage.height);
  
  const buffer = testCanvas.toBuffer('image/png');
  fs.writeFileSync('debug-images.png', buffer);
  
  console.log('\n✅ Debug image saved as debug-images.png');
  console.log('Check if images have unexpected transparent areas or are shifted');
  
  // Analyze pixel data at edges
  console.log('\n🔍 Checking edge pixels...');
  
  // Check sprite right edge
  const spriteCanvas = createCanvas(spriteImage.width, spriteImage.height);
  const spriteCtx = spriteCanvas.getContext('2d');
  spriteCtx.drawImage(spriteImage, 0, 0);
  
  const spriteData = spriteCtx.getImageData(spriteImage.width - 1, 0, 1, spriteImage.height);
  let hasContentAtRightEdge = false;
  for (let i = 3; i < spriteData.data.length; i += 4) {
    if (spriteData.data[i] > 0) { // Check alpha channel
      hasContentAtRightEdge = true;
      break;
    }
  }
  
  console.log(`Sprite right edge has content: ${hasContentAtRightEdge}`);
  
  // Check iryslogo edges
  const irysCanvas = createCanvas(iryslogoImage.width, iryslogoImage.height);
  const irysCtx = irysCanvas.getContext('2d');
  irysCtx.drawImage(iryslogoImage, 0, 0);
  
  const irysRightData = irysCtx.getImageData(iryslogoImage.width - 1, 0, 1, iryslogoImage.height);
  let hasIrysContentAtRight = false;
  for (let i = 3; i < irysRightData.data.length; i += 4) {
    if (irysRightData.data[i] > 0) {
      hasIrysContentAtRight = true;
      break;
    }
  }
  
  console.log(`Iryslogo right edge has content: ${hasIrysContentAtRight}`);
  
  console.log('\n💡 Possible issues:');
  console.log('1. If edges have no content, images might have transparent padding');
  console.log('2. Canvas might be clipping during tile generation');
  console.log('3. Tile boundaries might not align with image boundaries');
}

debugImagePlacement().catch(console.error);
