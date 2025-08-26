# ngrok을 사용한 메타버스 서버 설정

## 서버 PC (125.132.60.66)에서 설정

### 1. ngrok 설치
https://ngrok.com/download 에서 다운로드

또는 명령어로 설치:
```bash
# Mac (Homebrew)
brew install ngrok/ngrok/ngrok

# Windows (Chocolatey)
choco install ngrok

# Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok
```

### 2. ngrok 계정 설정 (선택사항)
무료 계정으로도 충분합니다:
1. https://dashboard.ngrok.com/signup 에서 가입
2. 인증 토큰 복사
3. 설정: `ngrok config add-authtoken YOUR_AUTH_TOKEN`

### 3. 서버 실행
```bash
# 터미널 1
cd server
npm start
# "Server running on 0.0.0.0:8547" 확인
```

### 4. ngrok 터널 시작
```bash
# 터미널 2
ngrok http 8547
```

다음과 같이 표시됩니다:
```
Session Status                online
Account                       your-email (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:8547

Connections                   ttl     opn     rt1     rt5     p50     p90
                             0       0       0.00    0.00    0.00    0.00
```

### 5. URL 복사
`Forwarding` 줄에서 HTTPS URL 복사:
예: `https://abc123def456.ngrok-free.app`

## 클라이언트 PC (현재 PC)에서 설정

### 1. .env 파일 수정
```bash
VITE_SOCKET_SERVER_URL=https://abc123def456.ngrok-free.app
```

⚠️ 중요: ngrok URL은 정확히 복사하세요!

### 2. 개발 서버 재시작
```bash
# Ctrl+C로 종료 후
npm run dev
```

### 3. 메타버스 탭 접속
- 브라우저에서 메타버스 탭 클릭
- 🟢 Connected 표시 확인

## ngrok 무료 플랜 제한사항
- 8시간마다 URL 변경됨
- 동시 접속자 40명 제한
- 월 1GB 트래픽 제한

## 팁
- ngrok 대시보드: http://127.0.0.1:4040 에서 실시간 요청 모니터링
- 고정 URL이 필요하면 유료 플랜 고려
- 개발/테스트용으로는 무료 플랜으로 충분

## 문제 해결
- "ERR_NGROK_3200" 에러: 무료 계정은 1개 터널만 가능. 기존 터널 종료 필요
- 느린 반응: ngrok 리전 변경 (예: `ngrok http 8547 --region ap`)
