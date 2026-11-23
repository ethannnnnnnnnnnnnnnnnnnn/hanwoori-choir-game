# Hanwoori Choir 20th Party Game (한우리 합창단 20기 송년회 파티 게임)

한우리 합창단 20기 실제 단원 16명 + 지휘자 + 김다솔 특별 단원 아바타와 함께 즐기는 실시간 인터랙티브 파티 게임입니다.

## 주요 기능
- **음악실 로비 (캔버스 & Y-Sorting)**: 원목 마루, 그랜드 피아노, 보면대, 티테이블, Welcome 매트, 하얀 강아지 등 원본 음악실을 고해상도 캔버스 및 깊이 정렬(Y-Sorting)로 복원.
- **실시간 A / B 서바이벌 퀴즈방**:
  - 음악 퀴즈방 (헷갈리는 명곡 10선 인트로 멜로디 퀴즈)
  - 합창단 / 트렌드 퀴즈방
  - 정답 공개 시 오답 구역 플랫폼이 열리며 캐릭터가 추락(Trapdoor Drop)하는 연출.
- **다양한 접속 모드**:
  - `참가자 화면 (/)`: 모바일 스마트폰 터치 패드 / PC WASD 조작, A/B 자동 이동 지원
  - `사회자 콘솔 (/admin)`: 문제 출제, 문 열기, 즉시 탈락/부활, 정답 전환, 문제 추가
  - `행사장 스크린 (/screen)`: 빔프로젝터 / TV 화면용 대형 중계 모드
- **실시간 동기화 지원**:
  - 기본: 브라우저 탭 간 BroadcastChannel 실시간 연동
  - Firebase Firestore / Auth 연동 지원

---

## 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 로컬 개발 서버 실행
```bash
npm run dev
```
기본적으로 `--host` 옵션이 적용되어 있어 동일 Wi-Fi 네트워크에 있는 스마트폰 브라우저에서 `http://[컴퓨터IP]:3000`으로 바로 접속할 수 있습니다.

### 3. Firebase 연동 방법 (선택 사항)
`.env` 파일 생성 후 Firebase 프로젝트 설정값을 등록하면 여러 디바이스 간 실시간 Firestore 동기화가 활성화됩니다:
```env
VITE_FIREBASE_CONFIG='{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'
```
*(Firebase 설정이 없을 경우 로컬 브라우저 탭 간 BroadcastChannel 모드로 작동합니다.)*

---

## 빌드 및 배포
```bash
npm run build
```
빌드된 결과물(`dist/`)을 GitHub Pages, Vercel, Firebase Hosting 등에 배포할 수 있습니다.
