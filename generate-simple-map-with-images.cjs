const fs = require('fs');
const path = require('path');

// 간단한 방법: Object Layer에 이미지 직접 배치
function createSimpleMapWithImages() {
  console.log('🗺️ Creating simple map with images using object layer...\n');
  
  const MAP_WIDTH = 40;
  const MAP_HEIGHT = 30;
  const TILE_SIZE = 32;
  
  // 기본 맵 구조
  const mapData = {
    compressionlevel: -1,
    height: MAP_HEIGHT,
    infinite: false,
    layers: [
      {
        // 바닥 레이어 (단순한 바닥)
        data: Array(MAP_WIDTH * MAP_HEIGHT).fill(1),
        height: MAP_HEIGHT,
        id: 1,
        name: "floor",
        opacity: 1,
        type: "tilelayer",
        visible: true,
        width: MAP_WIDTH,
        x: 0,
        y: 0
      },
      {
        // Object Layer - 이미지를 직접 배치
        draworder: "topdown",
        id: 2,
        name: "images",
        objects: [
          {
            // Sprite 이미지 객체
            id: 1,
            name: "sprite-image",
            type: "image",
            visible: true,
            x: (MAP_WIDTH / 2 - 4) * TILE_SIZE,  // 중앙 하단
            y: (MAP_HEIGHT - 8) * TILE_SIZE,
            width: 256,  // 실제 이미지 크기
            height: 192,
            gid: null,
            properties: [],
            image: "sprite-resized.png"  // 이미지 파일 직접 참조
          },
          {
            // Iryslogo 이미지 객체
            id: 2,
            name: "iryslogo-image",
            type: "image",
            visible: true,
            x: (MAP_WIDTH / 2 - 2) * TILE_SIZE,  // 정중앙
            y: (MAP_HEIGHT / 2 - 2) * TILE_SIZE,
            width: 128,  // 실제 이미지 크기
            height: 128,
            gid: null,
            properties: [],
            image: "iryslogo.png"  // 이미지 파일 직접 참조
          }
        ],
        opacity: 1,
        type: "objectgroup",
        visible: true,
        x: 0,
        y: 0
      }
    ],
    nextlayerid: 3,
    nextobjectid: 3,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.7.2",
    tileheight: TILE_SIZE,
    tilesets: [
      {
        // 최소한의 타일셋 (바닥용)
        columns: 1,
        firstgid: 1,
        image: "simple-floor.png",
        imageheight: 32,
        imagewidth: 32,
        margin: 0,
        name: "simple-floor",
        spacing: 0,
        tilecount: 1,
        tileheight: 32,
        tilewidth: 32
      }
    ],
    tilewidth: TILE_SIZE,
    type: "map",
    version: "1.6",
    width: MAP_WIDTH
  };
  
  // 맵 저장
  const outputPath = path.join('public', 'workadventure-map', 'simple-map.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapData, null, 2));
  
  console.log('✅ Simple map created successfully!');
  console.log(`📍 Location: ${outputPath}`);
  console.log('\n💡 Advantages of this approach:');
  console.log('  • No complex tileset generation needed');
  console.log('  • Images maintain their original quality');
  console.log('  • Easy to position and resize');
  console.log('  • Standard WorkAdventure approach for decorative images');
  
  // 간단한 바닥 타일 생성
  createSimpleFloorTile();
}

function createSimpleFloorTile() {
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  // 간단한 회색 바닥
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, 32, 32);
  
  // 테두리
  ctx.strokeStyle = '#444';
  ctx.strokeRect(0, 0, 32, 32);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join('public', 'workadventure-map', 'simple-floor.png'), buffer);
  console.log('\n✅ Simple floor tile created');
}

createSimpleMapWithImages();
