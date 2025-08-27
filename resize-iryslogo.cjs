const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function resizeIryslogo() {
  console.log('🎨 Resizing iryslogo.png to 128x128...\n');
  
  const iryslogoPath = path.join('public', 'workadventure-map', 'iryslogo.png');
  const irysImage = await loadImage(iryslogoPath);
  
  console.log(`📐 Original size: ${irysImage.width}x${irysImage.height}`);
  
  // Create 128x128 canvas
  const targetSize = 128; // 4x4 tiles
  const canvas = createCanvas(targetSize, targetSize);
  const ctx = canvas.getContext('2d');
  
  // Draw resized image
  ctx.drawImage(irysImage, 0, 0, targetSize, targetSize);
  
  // Save resized image
  const resizedPath = path.join('public', 'workadventure-map', 'iryslogo-resized.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(resizedPath, buffer);
  
  // Replace original with resized
  fs.renameSync(resizedPath, iryslogoPath);
  
  console.log('✅ Iryslogo resized to 128x128!');
  console.log(`📐 New size: ${targetSize}x${targetSize}px (4x4 tiles)`);
}

resizeIryslogo().catch(console.error);
