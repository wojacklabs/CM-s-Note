# 🎮 WorkAdventure 완전 가이드: 맵 & 서버 구축

## 📋 목차
1. [맵 제작 상세 가이드](#맵-제작-상세-가이드)
2. [서버 구축 방법](#서버-구축-방법)
3. [고급 커스터마이징](#고급-커스터마이징)
4. [실전 예제](#실전-예제)

---

## 🗺️ 맵 제작 상세 가이드

### 1. 필요한 도구

#### Tiled Map Editor 설치
```bash
# macOS
brew install tiled

# Windows
# https://www.mapeditor.org/download.html 에서 다운로드

# Linux
sudo snap install tiled
```

### 2. 맵 구조 이해하기

WorkAdventure 맵은 3개의 레이어로 구성됩니다:

```
┌─────────────────────────┐
│ 3. floorLayer (위)      │ ← 장식품, 가구
│ 2. objectLayer (중간)   │ ← 인터랙티브 오브젝트
│ 1. groundLayer (아래)   │ ← 바닥 타일
└─────────────────────────┘
```

### 3. 단계별 맵 제작

#### Step 1: 새 맵 생성
```
1. Tiled 실행
2. File → New → New Map
3. 설정:
   - Tile size: 32x32 pixels
   - Map size: 50x50 tiles (조정 가능)
   - Orientation: Orthogonal
```

#### Step 2: 타일셋 만들기

**방법 1: 직접 그리기**
```javascript
// generate-custom-tileset.cjs
const { createCanvas } = require('canvas');
const fs = require('fs');

const TILE_SIZE = 32;
const TILESET_WIDTH = 512; // 16 tiles wide
const TILESET_HEIGHT = 512; // 16 tiles high

const canvas = createCanvas(TILESET_WIDTH, TILESET_HEIGHT);
const ctx = canvas.getContext('2d');

// 바닥 타일들
const floors = [
  { name: 'wood', color: '#8B4513', pattern: 'horizontal' },
  { name: 'marble', color: '#F0F0F0', pattern: 'checkered' },
  { name: 'carpet', color: '#DC143C', pattern: 'solid' },
  { name: 'grass', color: '#228B22', pattern: 'noise' }
];

// 각 타일 그리기
floors.forEach((floor, index) => {
  const x = (index % 16) * TILE_SIZE;
  const y = Math.floor(index / 16) * TILE_SIZE;
  
  drawTile(ctx, x, y, floor);
});

// 벽 타일들
const walls = [
  { name: 'brick', color: '#A52A2A' },
  { name: 'concrete', color: '#696969' },
  { name: 'glass', color: '#87CEEB', opacity: 0.7 }
];

// 가구 타일들
const furniture = [
  { name: 'desk', base: '#8B4513', top: '#D2691E' },
  { name: 'chair', color: '#4B0082' },
  { name: 'sofa', color: '#FF6347' },
  { name: 'plant', pot: '#8B4513', leaves: '#228B22' }
];

// PNG로 저장
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('custom-tileset.png', buffer);
```

**방법 2: 무료 타일셋 사용**
- [OpenGameArt.org](https://opengameart.org/content/lpc-tile-atlas)
- [itch.io Free Assets](https://itch.io/game-assets/free/tag-tileset)
- [Kenney.nl](https://kenney.nl/assets?q=2d)

#### Step 3: 레이어 구성

**1. Ground Layer (바닥)**
```json
{
  "name": "ground",
  "type": "tilelayer",
  "properties": {
    "collides": false
  }
}
```

**2. Walls Layer (벽/충돌)**
```json
{
  "name": "walls",
  "type": "tilelayer",
  "properties": {
    "collides": true
  }
}
```

**3. Objects Layer (인터랙티브)**
```json
{
  "name": "objects",
  "type": "objectgroup",
  "objects": [
    {
      "name": "spawn",
      "type": "start",
      "x": 320,
      "y": 320
    }
  ]
}
```

### 4. 인터랙티브 오브젝트 종류

#### 🚪 시작 지점
```json
{
  "type": "start",
  "name": "spawn",
  "x": 100,
  "y": 100
}
```

#### 📹 화상회의 구역
```json
{
  "type": "area",
  "name": "meeting-room",
  "properties": [
    {
      "name": "jitsiRoom",
      "value": "MyMeetingRoom"
    },
    {
      "name": "jitsiTrigger",
      "value": "onaction" // or "onenter"
    }
  ]
}
```

#### 🔇 조용한 구역
```json
{
  "type": "area",
  "name": "silent-zone",
  "properties": [
    {
      "name": "silent",
      "value": true
    }
  ]
}
```

#### 🌐 웹사이트 임베드
```json
{
  "type": "area",
  "name": "website-embed",
  "properties": [
    {
      "name": "openWebsite",
      "value": "https://example.com"
    },
    {
      "name": "openWebsiteTrigger",
      "value": "onaction"
    },
    {
      "name": "openWebsiteWidth",
      "value": 800
    }
  ]
}
```

#### 🚪 다른 맵으로 이동
```json
{
  "type": "area",
  "name": "exit",
  "properties": [
    {
      "name": "exitUrl",
      "value": "./other-map.json"
    }
  ]
}
```

#### 💬 팝업 메시지
```json
{
  "type": "area",
  "name": "info",
  "properties": [
    {
      "name": "openPopup",
      "value": "welcome"
    },
    {
      "name": "openPopupEvent",
      "value": "환영합니다!\\n이곳은 CM's Note 가상 공간입니다."
    }
  ]
}
```

### 5. 맵 최적화

#### 타일 재사용
```javascript
// 반복 패턴으로 메모리 절약
const pattern = [
  [1, 2, 1, 2],
  [2, 1, 2, 1],
  [1, 2, 1, 2],
  [2, 1, 2, 1]
];

// 큰 영역에 패턴 적용
for (let y = 0; y < mapHeight; y += 4) {
  for (let x = 0; x < mapWidth; x += 4) {
    applyPattern(x, y, pattern);
  }
}
```

---

## 🖥️ 서버 구축 방법

### 옵션 1: 공용 서버 사용 (가장 쉬움)

```javascript
// 별도 설정 없이 바로 사용
const mapUrl = "https://your-domain.com/map.json";
const roomUrl = `https://play.workadventu.re/_/global/${mapUrl}`;
```

### 옵션 2: Docker로 자체 서버 구축

#### 1. 서버 요구사항
- CPU: 2 cores 이상
- RAM: 4GB 이상
- Storage: 20GB 이상
- OS: Linux (Ubuntu 20.04 추천)

#### 2. Docker Compose 설정

```yaml
# docker-compose.yml
version: '3.7'

services:
  reverse-proxy:
    image: traefik:v2.5
    command:
      - --api.insecure=true
      - --providers.docker
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  front:
    image: thecodingmachine/workadventure-front:latest
    environment:
      - PUSHER_URL=//pusher.${DOMAIN}
      - UPLOADER_URL=//uploader.${DOMAIN}
      - ADMIN_URL=//admin.${DOMAIN}
      - MAPS_URL=//maps.${DOMAIN}
      - STARTUP_COMMAND_1=yarn install
      - STARTUP_COMMAND_2=yarn run build
      - TURN_SERVER=turn:${DOMAIN}:3478
      - TURN_USER=workadventure
      - TURN_PASSWORD=${TURN_PASSWORD}
      - JITSI_URL=${JITSI_URL}
      - JITSI_PRIVATE_MODE=${JITSI_PRIVATE_MODE}
      - START_ROOM_URL=/_/global/maps.${DOMAIN}/starter/map.json
    labels:
      - "traefik.http.routers.front.rule=Host(`play.${DOMAIN}`)"
      - "traefik.http.routers.front.entrypoints=web,websecure"
      - "traefik.http.services.front.loadbalancer.server.port=80"

  pusher:
    image: thecodingmachine/workadventure-pusher:latest
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - API_URL=back:50051
      - FRONT_URL=https://play.${DOMAIN}
      - OPID_CLIENT_ID=${OPID_CLIENT_ID}
      - OPID_CLIENT_SECRET=${OPID_CLIENT_SECRET}
      - OPID_CLIENT_ISSUER=${OPID_CLIENT_ISSUER}
    labels:
      - "traefik.http.routers.pusher.rule=Host(`pusher.${DOMAIN}`)"
      - "traefik.http.routers.pusher.entrypoints=web,websecure"
      - "traefik.http.services.pusher.loadbalancer.server.port=8080"

  back:
    image: thecodingmachine/workadventure-back:latest
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - ADMIN_API_TOKEN=${ADMIN_API_TOKEN}
      - ADMIN_API_URL=http://admin:80
      - TURN_SERVER=turn:${DOMAIN}:3478
      - TURN_USER=workadventure
      - TURN_PASSWORD=${TURN_PASSWORD}
      - JITSI_URL=${JITSI_URL}
      - JITSI_ISS=${JITSI_ISS}
      - JITSI_SECRET=${JITSI_SECRET}

  uploader:
    image: thecodingmachine/workadventure-uploader:latest
    environment:
      - UPLOADER_URL=//uploader.${DOMAIN}
    labels:
      - "traefik.http.routers.uploader.rule=Host(`uploader.${DOMAIN}`)"
      - "traefik.http.routers.uploader.entrypoints=web,websecure"
      - "traefik.http.services.uploader.loadbalancer.server.port=8080"

  maps:
    image: nginx:alpine
    volumes:
      - ./maps:/usr/share/nginx/html
    labels:
      - "traefik.http.routers.maps.rule=Host(`maps.${DOMAIN}`)"
      - "traefik.http.routers.maps.entrypoints=web,websecure"
      - "traefik.http.services.maps.loadbalancer.server.port=80"

  coturn:
    image: coturn/coturn:4.5.2
    command:
      - turnserver
      - --log-file=stdout
      - --realm=${DOMAIN}
      - --lt-cred-mech
      - --fingerprint
      - --no-multicast-peers
      - --no-cli
      - --no-tlsv1
      - --no-tlsv1_1
      - --user=workadventure:${TURN_PASSWORD}
    ports:
      - "3478:3478/udp"
      - "3478:3478/tcp"
```

#### 3. 환경 변수 설정

```bash
# .env 파일
DOMAIN=your-domain.com
SECRET_KEY=your-secret-key-min-32-chars
ADMIN_API_TOKEN=another-secret-token
TURN_PASSWORD=turn-server-password
JITSI_URL=meet.jit.si
JITSI_ISS=your-jitsi-app-id
JITSI_SECRET=your-jitsi-secret
```

#### 4. SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot

# 인증서 발급
sudo certbot certonly --standalone -d play.your-domain.com -d pusher.your-domain.com -d maps.your-domain.com

# Traefik에 인증서 연결
# docker-compose.yml에 추가
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

#### 5. 서버 실행

```bash
# 서버 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 상태 확인
docker-compose ps
```

### 옵션 3: Kubernetes 배포 (대규모)

```yaml
# workadventure-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workadventure-front
spec:
  replicas: 3
  selector:
    matchLabels:
      app: workadventure-front
  template:
    metadata:
      labels:
        app: workadventure-front
    spec:
      containers:
      - name: front
        image: thecodingmachine/workadventure-front:latest
        ports:
        - containerPort: 80
        env:
        - name: PUSHER_URL
          value: "wss://pusher.your-domain.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: workadventure-front
spec:
  selector:
    app: workadventure-front
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

---

## 🎨 고급 커스터마이징

### 1. 커스텀 스크립트

#### 맵에 스크립트 추가
```json
{
  "properties": [
    {
      "name": "script",
      "value": "scripts/custom.js"
    }
  ]
}
```

#### scripts/custom.js
```javascript
/// <reference path="../node_modules/@workadventure/iframe-api-typings/iframe_api.d.ts" />

// 플레이어가 입장했을 때
WA.onInit().then(() => {
  console.log('Player entered the map!');
  
  // 환영 메시지
  WA.chat.sendChatMessage('Welcome to CM\'s Note Virtual Office!', 'System');
  
  // 플레이어 정보 가져오기
  WA.player.name.then((name) => {
    console.log('Player name:', name);
  });
});

// 특정 레이어 진입 시
WA.room.onEnterLayer('meeting-room').subscribe(() => {
  WA.chat.sendChatMessage('You entered the meeting room', 'System');
  
  // UI 버튼 추가
  WA.ui.openPopup('meeting-popup', 'Start a meeting?', [
    {
      label: 'Yes',
      callback: () => {
        WA.nav.openCoWebSite('https://meet.jit.si/CMNotesMeeting');
      }
    },
    {
      label: 'No',
      callback: () => {
        WA.ui.closePopup('meeting-popup');
      }
    }
  ]);
});

// 커스텀 변수 저장
WA.state.saveVariable('visitCount', 
  (WA.state.loadVariable('visitCount') || 0) + 1
);

// 다른 플레이어와 상호작용
WA.players.onPlayerJoin.subscribe((player) => {
  console.log(`${player.name} joined the room`);
});
```

### 2. 커스텀 액션

#### 미니게임 추가
```javascript
// 퀴즈 게임
WA.room.onEnterLayer('quiz-zone').subscribe(() => {
  const questions = [
    {
      q: "What is CM's Note?",
      a: ["A note app", "A virtual office", "A community platform", "All of above"],
      correct: 3
    }
  ];
  
  startQuiz(questions);
});

function startQuiz(questions) {
  let score = 0;
  
  questions.forEach((q, index) => {
    WA.ui.openPopup(`quiz-${index}`, q.q, 
      q.a.map((answer, i) => ({
        label: answer,
        callback: () => {
          if (i === q.correct) {
            score++;
            WA.chat.sendChatMessage('Correct! 🎉', 'Quiz');
          } else {
            WA.chat.sendChatMessage('Wrong answer 😅', 'Quiz');
          }
        }
      }))
    );
  });
}
```

#### 이벤트 시스템
```javascript
// 시간별 이벤트
const events = {
  "09:00": "Morning standup in Meeting Room 1",
  "12:00": "Lunch break - Visit the cafe area",
  "15:00": "Team building activity in Game Zone"
};

// 이벤트 알림
function checkEvents() {
  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  if (events[time]) {
    WA.ui.displayBubble(events[time]);
    WA.sound.playSound('notification.mp3');
  }
}

setInterval(checkEvents, 60000); // 매분 체크
```

### 3. 맵 간 연결

#### 멀티 플로어 건물
```
1층 (lobby.json)
  ↓ 엘리베이터
2층 (office.json)
  ↓ 계단
3층 (meeting.json)
  ↓ 옥상 출입구
옥상 (rooftop.json)
```

#### 연결 설정
```json
// lobby.json
{
  "name": "elevator",
  "type": "area",
  "properties": [
    {
      "name": "exitUrl",
      "value": "./office.json#from-elevator"
    }
  ]
}

// office.json
{
  "name": "from-elevator",
  "type": "start",
  "x": 320,
  "y": 480
}
```

---

## 🚀 실전 예제: CM's Note 가상 오피스

### 1. 맵 구조
```
┌────────────────────────────────────┐
│  🎯 Welcome    📋 Info Board       │
│     Area                           │
├──────────┬────────────┬───────────┤
│  Meeting │  Central   │  Meeting  │
│  Room 1  │   Hub      │  Room 2   │
│  (Video) │            │  (Video)  │
├──────────┼────────────┼───────────┤
│  Quiet   │   Game     │  Quiet    │
│  Zone 1  │   Area     │  Zone 2   │
│  (Muted) │            │  (Muted)  │
├──────────┴────────────┴───────────┤
│      ☕ Cafe & Lounge Area        │
└────────────────────────────────────┘
```

### 2. 특별 기능

#### 자동 회의실 예약
```javascript
// 회의실 사용 상태 관리
const meetingRooms = {
  room1: { occupied: false, user: null },
  room2: { occupied: false, user: null }
};

WA.room.onEnterLayer('meeting-room-1').subscribe(() => {
  if (!meetingRooms.room1.occupied) {
    meetingRooms.room1.occupied = true;
    meetingRooms.room1.user = WA.player.name;
    WA.state.saveVariable('room1-status', meetingRooms.room1);
  }
});
```

#### 실시간 대시보드
```javascript
// 맵 내 정보 표시
WA.ui.addActionBar({
  id: "stats",
  text: "Online: 0",
  callback: () => {
    WA.nav.openCoWebSite('https://your-domain.com/dashboard');
  }
});

// 실시간 업데이트
WA.players.onVariableChange('playerCount').subscribe((count) => {
  WA.ui.updateActionBar("stats", `Online: ${count}`);
});
```

### 3. 배포 체크리스트

✅ 맵 파일 준비
- [ ] map.json
- [ ] tileset.png
- [ ] tileset.tsx
- [ ] scripts/*.js

✅ 서버 설정
- [ ] Docker Compose 구성
- [ ] 환경 변수 설정
- [ ] SSL 인증서
- [ ] 도메인 설정

✅ 테스트
- [ ] 로컬 테스트
- [ ] 멀티플레이어 테스트
- [ ] 모바일 테스트
- [ ] 성능 테스트

✅ 모니터링
- [ ] 서버 로그
- [ ] 사용자 분석
- [ ] 에러 추적
- [ ] 성능 모니터링

---

## 📚 추가 리소스

### 공식 문서
- [WorkAdventure Docs](https://docs.workadventu.re/)
- [Map Building Guide](https://docs.workadventu.re/map-building)
- [Scripting API](https://docs.workadventu.re/developer)

### 커뮤니티
- [Discord Server](https://discord.gg/workadventure)
- [GitHub Discussions](https://github.com/thecodingmachine/workadventure/discussions)
- [Example Maps](https://github.com/workadventure/workadventure-map-starter-kit)

### 도구
- [Tiled Map Editor](https://www.mapeditor.org/)
- [Piskel (픽셀 아트)](https://www.piskelapp.com/)
- [TexturePacker](https://www.codeandweb.com/texturepacker)

이제 WorkAdventure의 모든 것을 마스터할 준비가 되었습니다! 🎮✨
