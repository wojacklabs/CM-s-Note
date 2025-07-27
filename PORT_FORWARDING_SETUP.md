# 포트 포워딩 설정 가이드 (포트 8547)

## 1. 서버 PC 설정

### 1.1 내부 IP 주소 확인
```bash
# Windows
ipconfig
# "IPv4 주소" 확인 (예: 192.168.1.100)

# Mac
ifconfig | grep "inet " | grep -v 127.0.0.1
# 192.168.x.x 형태의 주소 확인

# Linux
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### 1.2 서버 실행
```bash
cd server
npm start
```
다음과 같이 표시됨:
```
Server running on 0.0.0.0:8547
Local: http://localhost:8547
Network: http://192.168.1.100:8547
```

## 2. 공유기(라우터) 포트 포워딩 설정

### 2.1 공유기 관리 페이지 접속
```bash
# 기본 게이트웨이 확인
# Windows: ipconfig에서 "기본 게이트웨이" 확인
# Mac/Linux: netstat -nr | grep default

# 일반적인 주소:
# 192.168.1.1
# 192.168.0.1
# 192.168.219.1 (KT)
# 172.30.1.254 (SK)
```

### 2.2 관리자 로그인
- 기본 ID/PW는 공유기 뒷면 스티커 참조
- 일반적으로 admin/admin 또는 admin/password

### 2.3 포트 포워딩 메뉴 찾기
제조사별 메뉴 위치:
- **ipTIME**: 고급설정 → NAT/라우터 → 포트포워드
- **ASUS**: WAN → 가상서버/포트포워딩
- **TP-Link**: 고급 → NAT 전달 → 가상서버
- **Netgear**: 고급 → 설정 → 포트포워딩/포트트리거링

### 2.4 포트 포워딩 규칙 추가
```
서비스 이름: CM_Metaverse
외부 포트: 8547
내부 포트: 8547
내부 IP: 192.168.1.100 (서버 PC의 내부 IP)
프로토콜: TCP
활성화: 예/체크
```

## 3. 방화벽 설정

### Windows 방화벽
```powershell
# 관리자 권한으로 PowerShell 실행
New-NetFirewallRule -DisplayName "CM Metaverse Server" -Direction Inbound -Protocol TCP -LocalPort 8547 -Action Allow
```

### Mac 방화벽
1. 시스템 환경설정 → 보안 및 개인 정보 보호
2. 방화벽 → 방화벽 옵션
3. Node.js 허용

### Linux (Ubuntu/Debian)
```bash
sudo ufw allow 8547/tcp
sudo ufw reload
```

## 4. 공인 IP 확인
```bash
# 방법 1
curl ifconfig.me

# 방법 2
curl ipinfo.io/ip

# 방법 3
웹브라우저에서 https://whatismyipaddress.com 접속
```

## 5. 클라이언트 설정

### 5.1 .env 파일 생성
```bash
# 프로젝트 루트에서
cp env.example .env
```

### 5.2 .env 파일 수정
```
VITE_SOCKET_SERVER_URL=http://YOUR_PUBLIC_IP:8547
```
예시:
```
VITE_SOCKET_SERVER_URL=http://123.456.789.012:8547
```

## 6. 연결 테스트

### 6.1 서버 상태 확인
브라우저에서:
```
http://YOUR_PUBLIC_IP:8547/health
```
응답:
```json
{"status":"ok","players":0}
```

### 6.2 클라이언트 실행
```bash
npm run dev
```

### 6.3 연결 상태 확인
- 메타버스 탭에서 🟢 Connected 표시 확인
- 브라우저 콘솔에서 연결 로그 확인

## 7. 문제 해결

### 연결 안됨
1. **포트 포워딩 확인**
   ```bash
   # 외부에서 포트 열림 확인
   https://www.yougetsignal.com/tools/open-ports/
   ```

2. **방화벽 확인**
   - Windows Defender 방화벽 일시 중지 후 테스트
   - 백신 프로그램 방화벽 확인

3. **공유기 재시작**
   - 포트 포워딩 설정 후 공유기 재시작

4. **ISP 차단 확인**
   - 일부 ISP는 특정 포트 차단
   - ISP에 문의하여 포트 개방 요청

### 보안 주의사항
⚠️ **경고**: 포트 포워딩은 보안 위험이 있습니다!

1. **사용하지 않을 때는 포트 포워딩 비활성화**
2. **강력한 방화벽 규칙 설정**
3. **접속 로그 모니터링**
4. **가능하면 VPN 사용 권장**

## 8. 대체 포트 (8547이 사용 중인 경우)
```
8548, 8549, 8550  # 순차적 포트
9547, 9548        # 9000번대
7547, 7548        # 7000번대
18547             # 높은 번호
```

서버와 클라이언트 모두에서 포트 번호 변경 필요!
