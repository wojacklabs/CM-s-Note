# CM's Notes Web

CM's Notes Web은 CM's Note 브라우저 확장 프로그램에서 업로드한 프로젝트별 CM이 작성한 노트들을 쿼리하여 큐레이팅하는 웹 서비스입니다.

## 주요 기능

### 1. 사용자/사용자의 노트 보여주기
- 프로젝트별 CM, 유저 타입, 아이콘별 필터링
- 사용자 프로필과 노트 뱃지 표시
- 뱃지 클릭 시 노트 상세 내용 보기

### 2. 사용자의 최근 트윗 보여주기
- CM 노트가 있는 사용자들의 트위터 트윗을 마키(marquee) 형태로 표시
- 속도와 방향 조절 가능

## 시작하기

### 필수 요구사항
- Node.js 16.0 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드된 파일 미리보기
npm run preview
```

## 기술 스택

- **Frontend**: React, TypeScript, Vite
- **Routing**: React Router
- **Styling**: CSS with CSS Variables
- **Data Source**: Irys Network (Arweave)
- **UI Components**: react-fast-marquee

## 프로젝트 구조

```
src/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # 페이지 컴포넌트
├── services/      # API 및 외부 서비스
├── types/         # TypeScript 타입 정의
└── styles/        # 전역 스타일
```

## 주의사항

- Twitter API 인증이 필요한 기능은 현재 모의 데이터로 구현되어 있습니다.
- 실제 트윗을 표시하려면 Twitter API v2 설정이 필요합니다.
- Irys Network에서 데이터를 가져오므로 네트워크 연결이 필요합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 