const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins in development
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        // In production, allow specific origins or patterns
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:5174', 
          'http://localhost:5175',
          'http://localhost:5176',
          'http://localhost:5177',
          'http://localhost:5178',
          /^https:\/\/.*\.vercel\.app$/,  // Vercel deployments
          /^https:\/\/.*\.netlify\.app$/,  // Netlify deployments
          /^https:\/\/.*\.ngrok\.io$/,     // ngrok tunnels
          /^https:\/\/.*\.railway\.app$/,  // Railway deployments
        ];
        
        const isAllowed = allowedOrigins.some(allowed => {
          if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return allowed === origin;
        });
        
        callback(null, isAllowed);
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 접속한 플레이어 관리
const players = new Map();

io.on('connection', (socket) => {
  const clientIP = socket.handshake.address;
  console.log(`New player connected: ${socket.id} from ${clientIP}`);
  
  // 새 플레이어 생성
  const newPlayer = {
    id: socket.id,
    x: Math.floor(Math.random() * 800) + 100,
    y: Math.floor(Math.random() * 500) + 100,
    twitterHandle: `Player${Math.floor(Math.random() * 1000)}`
  };
  
  players.set(socket.id, newPlayer);
  
  // 현재 접속 중인 모든 플레이어 정보 전송
  socket.emit('currentPlayers', Object.fromEntries(players));
  
  // 다른 플레이어들에게 새 플레이어 접속 알림
  socket.broadcast.emit('playerJoined', newPlayer);
  
  // 플레이어 이동 처리
  socket.on('playerMove', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
      
      // 다른 플레이어들에게 이동 정보 전송
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: data.x,
        y: data.y
      });
    }
  });

  // 채팅 메시지 처리
  socket.on('chat', (message) => {
    const player = players.get(socket.id);
    console.log(`Chat from ${socket.id} (${player?.name || 'Unknown'}): ${message}`);

    // 모든 플레이어에게 채팅 메시지 전송
    io.emit('chat', {
      playerId: socket.id,
      message: message.substring(0, 100) // 메시지 길이 제한
    });
  });

  // 플레이어 이름 설정
  socket.on('setName', (name) => {
    const player = players.get(socket.id);
    if (player) {
      player.name = name.substring(0, 20); // 이름 길이 제한
      console.log(`Player ${socket.id} set name to: ${player.name}`);
    }
  });
  
  // 플레이어 연결 해제 처리
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    players.delete(socket.id);
    
    // 다른 플레이어들에게 연결 해제 알림
    io.emit('playerLeft', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', players: players.size });
});

const PORT = process.env.PORT || 8547; // Using uncommon port for metaverse server
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  
  // Get local IP address
  const os = require('os');
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach(ifname => {
    interfaces[ifname].forEach(iface => {
      if ('IPv4' !== iface.family || iface.internal !== false) return;
      console.log(`Network: http://${iface.address}:${PORT}`);
    });
  });
});
