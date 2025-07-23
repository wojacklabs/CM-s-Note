const { createCanvas } = require('canvas');
const fs = require('fs');

// Create tileset for WorkAdventure
const canvas = createCanvas(160, 128);
const ctx = canvas.getContext('2d');

// Tile 0: Wall (gray)
ctx.fillStyle = '#4a5568';
ctx.fillRect(0, 0, 32, 32);
ctx.strokeStyle = '#2d3748';
ctx.strokeRect(0, 0, 32, 32);

// Tile 1: Floor (light wood)
ctx.fillStyle = '#f7fafc';
ctx.fillRect(32, 0, 32, 32);
ctx.strokeStyle = '#e2e8f0';
ctx.strokeRect(32, 0, 32, 32);

// Tile 2: Carpet (blue)
ctx.fillStyle = '#4299e1';
ctx.fillRect(64, 0, 32, 32);
// Carpet pattern
ctx.fillStyle = '#3182ce';
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    if ((i + j) % 2 === 0) {
      ctx.fillRect(64 + i * 8, j * 8, 8, 8);
    }
  }
}

// Tile 3: Meeting room floor (green)
ctx.fillStyle = '#48bb78';
ctx.fillRect(96, 0, 32, 32);
ctx.strokeStyle = '#38a169';
ctx.strokeRect(96, 0, 32, 32);

// Tile 4: Quiet zone floor (purple)
ctx.fillStyle = '#9f7aea';
ctx.fillRect(128, 0, 32, 32);
ctx.strokeStyle = '#805ad5';
ctx.strokeRect(128, 0, 32, 32);

// Second row - Decorative objects
// Tile 10: Desk
ctx.fillStyle = '#8b4513';
ctx.fillRect(0, 32, 32, 24);
ctx.fillStyle = '#654321';
ctx.fillRect(2, 34, 28, 20);

// Tile 11: Chair
ctx.fillStyle = '#2d3748';
ctx.fillRect(32, 32, 20, 20);
ctx.fillRect(36, 52, 12, 8);
ctx.fillStyle = '#1a202c';
ctx.fillRect(34, 34, 16, 16);

// Tile 12: Table
ctx.fillStyle = '#975a16';
ctx.fillRect(64, 32, 32, 20);
ctx.fillStyle = '#744210';
ctx.fillRect(66, 34, 28, 16);
// Table legs
ctx.fillStyle = '#975a16';
ctx.fillRect(68, 50, 4, 10);
ctx.fillRect(88, 50, 4, 10);

// Tile 13: Plant
ctx.fillStyle = '#48bb78';
ctx.beginPath();
ctx.arc(112, 44, 12, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#8b4513';
ctx.fillRect(106, 52, 12, 10);

// Tile 14: Sofa
ctx.fillStyle = '#e53e3e';
ctx.fillRect(128, 32, 32, 20);
ctx.fillStyle = '#c53030';
ctx.fillRect(130, 34, 28, 16);
ctx.fillRect(128, 48, 32, 8);

// Third row - Interactive objects
// Tile 15: Whiteboard
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 64, 32, 24);
ctx.strokeStyle = '#2d3748';
ctx.strokeRect(0, 64, 32, 24);
ctx.strokeRect(2, 66, 28, 20);
// Some scribbles
ctx.strokeStyle = '#4299e1';
ctx.beginPath();
ctx.moveTo(5, 70);
ctx.lineTo(15, 75);
ctx.stroke();

// Tile 16: Welcome sign
ctx.fillStyle = '#d69e2e';
ctx.fillRect(32, 64, 32, 20);
ctx.fillStyle = '#b7791f';
ctx.fillRect(34, 66, 28, 16);
// Sign post
ctx.fillStyle = '#8b4513';
ctx.fillRect(46, 84, 4, 12);
// Text hint
ctx.fillStyle = '#ffffff';
ctx.font = '8px Arial';
ctx.fillText('WELCOME', 36, 76);

// Save the tileset
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/workadventure-map/tileset.png', buffer);

console.log('WorkAdventure tileset created successfully!');
