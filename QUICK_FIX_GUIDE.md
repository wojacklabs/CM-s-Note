# 🚨 ERR_CONNECTION_REFUSED 해결 가이드

## 서버 PC (125.132.60.66)에서 즉시 확인할 사항

### 1. 서버가 실행 중인가? ⚡
```bash
# 서버 디렉토리로 이동
cd CM's-Note-Web/server  # 또는 서버가 있는 경로

# 서버 실행
npm start

# 다음과 같이 표시되어야 함:
# Server running on 0.0.0.0:8547
# Local: http://localhost:8547
```

### 2. 포트가 실제로 열려있는가? 🔍
```bash
# Windows
netstat -an | findstr 8547

# Mac/Linux
netstat -an | grep 8547
# 또는
sudo lsof -i :8547
```

결과에 `LISTEN` 상태가 보여야 합니다:
```
TCP    0.0.0.0:8547    0.0.0.0:*    LISTEN
```

### 3. 로컬에서 작동하는가? 💻
서버 PC의 브라우저에서:
```
http://localhost:8547/health
```

작동한다면 → 방화벽/포트포워딩 문제
작동 안한다면 → 서버 자체 문제

## 🔧 즉시 해결 방법

### 방법 1: Windows Defender 방화벽 임시 해제
1. Windows 검색 → "Windows Defender 방화벽"
2. "Windows Defender 방화벽 켜기 또는 끄기"
3. 개인 네트워크와 공용 네트워크 모두 "끄기" (테스트용)
4. 테스트 후 다시 켜기!

### 방법 2: 포트 변경
서버가 다른 프로세스와 충돌할 수 있음:
```bash
# server/index.js에서
const PORT = process.env.PORT || 18547;  # 8547 → 18547

# 클라이언트 .env도 변경
VITE_SOCKET_SERVER_URL=http://125.132.60.66:18547
```

### 방법 3: 공유기 설정 확인
1. 공유기 관리 페이지 접속 (보통 192.168.1.1)
2. 포트포워딩/가상서버 메뉴
3. 설정 확인:
   - 외부 포트: 8547
   - 내부 IP: 서버 PC의 내부 IP
   - 내부 포트: 8547
   - 활성화: ✓

## 🚀 가장 빠른 대안: ngrok

서버 PC에서:
```bash
# 1. ngrok 다운로드
# https://ngrok.com/download

# 2. 서버 실행
cd server
npm start

# 3. 다른 터미널에서 ngrok 실행
ngrok http 8547

# 4. 생성된 URL 사용 (예: https://abc123.ngrok.io)
```

클라이언트 .env:
```
VITE_SOCKET_SERVER_URL=https://abc123.ngrok.io
```

## 📝 체크리스트

서버 PC에서:
- [ ] 서버가 실행 중 (`npm start`)
- [ ] 포트 8547이 LISTEN 상태
- [ ] localhost:8547/health 접속 가능
- [ ] 방화벽 규칙 추가 또는 임시 해제
- [ ] 공유기 포트포워딩 설정
- [ ] 백신 프로그램 방화벽 확인

## 🆘 여전히 안 되면?

1. **포트 스캔**: https://www.yougetsignal.com/tools/open-ports/
   - Remote Address: 125.132.60.66
   - Port Number: 8547
   - "Closed" 표시 → 포트포워딩 문제

2. **ISP 문의**: 일부 ISP는 특정 포트 차단

3. **클라우드 배포**: Railway/Render 무료 배포
