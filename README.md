# 청춘묶음 — 사이트 프로토타입

구성
- `index.html` : 실제 UI/기능 프로토타입
- `server.mjs` : Gemini 질문 생성 API 프록시 + 정적 파일 서버

## 실행
Node.js 18+ 권장.

```bash
cd chungchun_site
GEMINI_API_KEY="여기에_키" node server.mjs
```

브라우저에서 `http://127.0.0.1:3000` 접속.

Gemini 없이도 사이트의 대부분 기능은 동작하고, 질문 생성은 임시 질문으로 대체된다.

## Gemini 연결
서버는 Gemini API의 `generateContent` 엔드포인트를 호출하고, 브라우저에는 API 키를 노출하지 않는다. 기본 모델명은 `GEMINI_MODEL` 환경변수로 바꿀 수 있다.


## 이번 업데이트
- 친구 추가/필름흔적 기능 제거
- 친구 전용 메뉴 제거
- 홈/기록/질문/편집/목록/공유/설정 화면에 뒤로가기 추가
- `server.mjs`에서 Gemini API 키를 직접 입력할 수 있도록 설정
- API 키는 브라우저의 `index.html`이 아니라 서버에서 사용

### Gemini API 키
`server.mjs` 상단의 다음 부분에 키를 넣으면 됩니다.

```js
const API_KEY = process.env.GEMINI_API_KEY || '여기에_GEMINI_API_KEY_입력';
```

실제 도메인 운영에서는 브라우저 코드에 API 키를 넣지 않는 것을 권장합니다.
