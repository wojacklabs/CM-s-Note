# 🌐 WorkAdventure에서 DNS가 필요한 이유

## 📌 DNS란?

DNS는 도메인 이름(예: play.example.com)을 IP 주소(예: 192.168.1.100)로 변환해주는 시스템입니다.
사람이 기억하기 쉬운 주소를 컴퓨터가 이해할 수 있는 주소로 바꿔줍니다.

```
사용자가 입력: play.example.com
DNS가 변환: 192.168.1.100
```

## 🤔 WorkAdventure에 DNS가 필요한 이유

### 1. **멀티 서비스 구조**

WorkAdventure는 여러 개의 마이크로서비스로 구성되어 있습니다:

```
┌──────────────────────────────────────┐
│         WorkAdventure 구조           │
├──────────────────────────────────────┤
│ play.example.com    → Front 서비스   │
│ pusher.example.com  → Pusher 서비스  │
│ maps.example.com    → Maps 서비스    │
│ uploader.example.com → Uploader 서비스│
└──────────────────────────────────────┘
```

각 서비스가 다른 역할을 수행:
- **Front**: 메인 게임 인터페이스
- **Pusher**: 실시간 통신 (WebSocket)
- **Maps**: 맵 파일 제공
- **Uploader**: 파일 업로드 처리

### 2. **WebSocket 연결 문제**

```javascript
// DNS 없이 IP만 사용할 경우의 문제
const socket = new WebSocket('ws://192.168.1.100:8080'); // ❌ 브라우저 보안 정책 위반

// DNS를 사용할 경우
const socket = new WebSocket('wss://pusher.example.com'); // ✅ 정상 작동
```

### 3. **SSL/HTTPS 인증서**

SSL 인증서는 도메인 이름 기반으로 발급됩니다:

```bash
# Let's Encrypt로 SSL 인증서 발급
certbot certonly -d play.example.com -d pusher.example.com

# IP 주소로는 발급 불가능
certbot certonly -d 192.168.1.100  # ❌ 작동하지 않음
```

### 4. **CORS (Cross-Origin Resource Sharing)**

브라우저 보안 정책상 다른 도메인 간 통신에 제약이 있습니다:

```javascript
// 메인 사이트에서 다른 서비스 호출
// play.example.com에서 실행되는 코드
fetch('https://maps.example.com/map.json')  // ✅ 같은 도메인 패밀리
fetch('http://192.168.1.100:8081/map.json') // ❌ CORS 에러 발생
```

## 🔧 DNS 없이 사용하는 방법들

### 방법 1: 공용 WorkAdventure 서버 사용

```javascript
// DNS 설정 없이 바로 사용 가능
const mapUrl = window.location.origin + '/workadventure-map/map.json';
const roomUrl = `https://play.workadventu.re/_/global/${mapUrl}`;
```

장점:
- ✅ DNS 설정 불필요
- ✅ SSL 인증서 불필요
- ✅ 서버 관리 불필요

단점:
- ❌ 커스터마이징 제한
- ❌ 데이터 프라이버시
- ❌ 서버 위치 제어 불가

### 방법 2: 로컬 개발 (localhost)

```javascript
// 개발 환경에서만 사용
const services = {
  front: 'http://localhost:8080',
  pusher: 'http://localhost:8081',
  maps: 'http://localhost:8082'
};
```

사용 범위:
- ✅ 개발 및 테스트
- ❌ 외부 접속 불가
- ❌ 팀 협업 불가

### 방법 3: hosts 파일 수정

```bash
# /etc/hosts (Mac/Linux) 또는 C:\Windows\System32\drivers\etc\hosts (Windows)
192.168.1.100 play.myworkadventure.local
192.168.1.100 pusher.myworkadventure.local
192.168.1.100 maps.myworkadventure.local
```

제한사항:
- ✅ 로컬 네트워크에서 사용 가능
- ❌ 각 사용자가 수동 설정 필요
- ❌ SSL 인증서 문제 여전히 존재

### 방법 4: 자체 서명 인증서

```bash
# 자체 서명 SSL 인증서 생성
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

문제점:
- ⚠️ 브라우저 보안 경고
- ❌ 사용자가 수동으로 신뢰 추가 필요

## 📊 비교표

| 방법 | DNS 필요 | SSL | 외부 접속 | 난이도 |
|-----|---------|-----|----------|--------|
| 공용 서버 | ❌ | ✅ | ✅ | ⭐ |
| 자체 서버 + DNS | ✅ | ✅ | ✅ | ⭐⭐⭐ |
| 로컬호스트 | ❌ | ❌ | ❌ | ⭐ |
| IP 직접 사용 | ❌ | ❌ | ⚠️ | ⭐⭐ |

## 🎯 권장사항

### 1. **개발/테스트 단계**
```javascript
// 공용 WorkAdventure 서버 사용
const mapUrl = 'https://your-github-pages.github.io/maps/map.json';
const playUrl = `https://play.workadventu.re/_/global/${mapUrl}`;
```

### 2. **프로덕션 단계**
```yaml
# 자체 서버 + DNS 설정
services:
  - play.your-domain.com
  - pusher.your-domain.com
  - maps.your-domain.com
```

### 3. **대안: 단일 도메인 리버스 프록시**
```nginx
# nginx 설정으로 하나의 도메인으로 통합
server {
    server_name workadventure.example.com;
    
    location / {
        proxy_pass http://front:8080;
    }
    
    location /pusher {
        proxy_pass http://pusher:8081;
    }
    
    location /maps {
        proxy_pass http://maps:8082;
    }
}
```

## 💡 실용적인 해결책

### 무료 도메인 서비스 활용

1. **Freenom** (무료 .tk, .ml 도메인)
   - https://www.freenom.com

2. **DuckDNS** (무료 서브도메인)
   - https://www.duckdns.org
   - 예: yourname.duckdns.org

3. **No-IP** (무료 동적 DNS)
   - https://www.noip.com
   - 예: yourname.ddns.net

### 설정 예시 (DuckDNS)

```bash
# DuckDNS 설정
curl "https://www.duckdns.org/update?domains=yourname&token=your-token&ip="

# WorkAdventure 설정
DOMAIN=yourname.duckdns.org
```

## 🔍 요약

**DNS가 필요한 핵심 이유:**
1. ✅ 여러 서비스를 구분하기 위해
2. ✅ SSL 인증서 발급을 위해
3. ✅ 브라우저 보안 정책 준수를 위해
4. ✅ 사용자 접근성 향상을 위해

**대안:**
- 공용 WorkAdventure 서버 사용 (가장 간단)
- 무료 도메인 서비스 활용
- 로컬 개발 환경으로 제한

DNS 설정이 복잡하다면, 먼저 공용 서버로 시작하고 나중에 자체 서버로 전환하는 것을 추천합니다! 🚀
