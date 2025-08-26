# 서버 연결 문제 해결 가이드

## 현재 상황
- 클라이언트 IP: 현재 PC
- 서버 IP: 125.132.60.66
- 포트: 8547
- 에러: WebSocket connection timeout

## 서버 PC에서 확인할 사항

### 1. 서버가 실행 중인지 확인
```bash
# 서버 PC에서
cd server
npm start

# 다음과 같이 표시되어야 함:
# Server running on 0.0.0.0:8547
# Local: http://localhost:8547
# Network: http://192.168.x.x:8547
```

### 2. 포트가 열려있는지 확인
```bash
# 서버 PC에서
netstat -an | grep 8547
# 또는
lsof -i :8547
```

### 3. 방화벽 설정 확인

#### Windows 방화벽
```powershell
# 관리자 권한 PowerShell
# 인바운드 규칙 추가
New-NetFirewallRule -DisplayName "CM Metaverse Server" -Direction Inbound -Protocol TCP -LocalPort 8547 -Action Allow

# 아웃바운드 규칙 추가 (WebSocket용)
New-NetFirewallRule -DisplayName "CM Metaverse Server Outbound" -Direction Outbound -Protocol TCP -LocalPort 8547 -Action Allow
```

#### Mac 방화벽
```bash
# 방화벽이 켜져있다면 Node.js 허용 필요
# 시스템 환경설정 → 보안 및 개인정보 보호 → 방화벽 → 방화벽 옵션
```

#### Linux 방화벽
```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 8547/tcp
sudo ufw reload

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=8547/tcp
sudo firewall-cmd --reload
```

### 4. 공유기 포트 포워딩 확인
서버 PC의 공유기에서:
- 외부 포트: 8547
- 내부 IP: 서버 PC의 내부 IP (192.168.x.x)
- 내부 포트: 8547
- 프로토콜: TCP

### 5. 서버 CORS 설정 확인
`server/index.js`에서 CORS가 올바르게 설정되어 있는지 확인:
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: '*', // 개발 중에는 모든 origin 허용
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

## 테스트 방법

### 1. 기본 연결 테스트
브라우저에서 접속:
```
http://125.132.60.66:8547/health
```

성공 시 응답:
```json
{"status":"ok","players":0}
```

### 2. 포트 열림 확인
외부 포트 검사 도구 사용:
- https://www.yougetsignal.com/tools/open-ports/
- 포트: 8547 입력 후 확인

### 3. 로컬 네트워크에서 테스트
같은 네트워크의 다른 기기에서:
```
http://서버PC내부IP:8547/health
```

## 일반적인 문제와 해결책

### 1. ISP가 포트를 차단하는 경우
- 일부 ISP는 특정 포트를 차단
- 다른 포트로 변경 시도 (예: 18547, 28547)
- ISP에 문의하여 포트 개방 요청

### 2. 공유기가 DMZ 설정이 필요한 경우
- 임시로 서버 PC를 DMZ에 설정
- ⚠️ 보안 위험이 있으므로 테스트 후 비활성화

### 3. Double NAT 문제
- 공유기가 2개 이상 연결된 경우
- 모든 공유기에서 포트 포워딩 설정 필요

## 서버 로그 확인
서버 PC에서 로그 확인:
```bash
# server/index.js에 로그 추가
io.on('connection', (socket) => {
  console.log('New connection attempt from:', socket.handshake.address);
  // ...
});
```

## 대안: 클라우드 서버 사용
포트 포워딩이 어려운 경우:
1. ngrok 사용 (임시)
2. Railway/Render 배포 (무료)
3. AWS EC2 프리티어 사용
