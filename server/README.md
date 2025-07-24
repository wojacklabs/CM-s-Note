# CM's Notes Metaverse Server

이 서버는 CM's Notes의 메타버스 기능을 위한 Socket.IO 서버입니다.

## 설치

```bash
cd server
npm install
```

## 실행

개발 모드:
```bash
npm run dev
```

프로덕션 모드:
```bash
npm start
```

## 환경 변수

- `PORT`: 서버 포트 (기본값: 3001)

## 배포

Heroku, Railway, Render 등의 서비스를 사용하여 배포할 수 있습니다.

클라이언트의 `VITE_SOCKET_SERVER_URL` 환경 변수를 배포된 서버 URL로 설정하세요.
