# 테스트 결과

생성 시점: 2026-07-08

## 자동 검사 결과

- 정적/PWA 검사: **84개 항목 모두 통과**
- JavaScript 기능 모의 검사: **10개 항목 모두 통과**
- 원본 Excel과 배포용 JSON 대조: **현장명·주소 73개 모두 일치**

## 확인한 항목

- HTML 기본 구조와 필수 PWA 연결
- `manifest.json` JSON 문법, 앱 이름, 시작 주소, 범위, standalone 설정
- 192×192, 512×512, maskable 512×512 아이콘 크기 및 파일 존재
- `service-worker.js`, `js/app.js` JavaScript 문법
- GitHub Pages 저장소 하위 경로에서 작동하도록 모든 내부 파일을 상대경로로 연결
- 서비스 워커 앱 셸 목록의 모든 파일 존재
- 로컬 정적 서버의 `/total-eng-address/` 하위 주소에서 HTML, CSS, JS, JSON, 아이콘 응답 확인
- `data/sites.json`: 총 73개, 일반현장 51개, 쿠팡 22개, 고유 ID 및 필수 필드 확인
- 검색, 상세보기, 즐겨찾기, 지도 URL, 주소복사 로직 모의 실행
- 비밀번호/API 비밀키/토큰 형태의 문자열 기본 검사 결과 미검출
- GitHub 공개 배포에 불필요한 `address.xlsx` 원본 파일 제외

## 수정한 주요 사항

- GitHub Pages 하위 경로 호환을 위한 `./` 상대경로 적용
- PWA manifest 보강 및 maskable 아이콘 추가
- iPhone용 180px 아이콘과 브라우저 favicon 추가
- 서비스 워커 캐시 무한 증가 가능성을 제거하고 네트워크 우선/캐시 대체 방식 적용
- JSON 데이터가 HTML로 삽입될 때 특수문자를 안전하게 처리
- 인라인 클릭 코드를 데이터 속성 기반 이벤트 처리로 변경
- 설치 버튼, iPhone 설치 안내, 다크모드 저장, 키보드 접근성 보강
- `.gitignore`, `.nojekyll`, `robots.txt`, GitHub 배포 안내 추가

## 환경상 제한된 검사

작업 환경의 Chromium 관리 정책이 로컬 주소와 파일 주소 접속을 차단하여 실제 Chromium 안에서 설치 배너를 누르거나 서비스 워커를 오프라인 모드로 전환하는 자동화 검사는 수행하지 못했습니다. 대신 정적 서버 응답, 하위 경로, 파일 참조, 캐시 목록, 문법, 데이터 구조와 앱 로직을 검사했습니다.

GitHub Pages 배포 후 다음 두 가지를 실제 기기에서 최종 확인해야 합니다.

1. Android Chrome에서 `앱 설치` 또는 `홈 화면에 추가`가 표시되는지
2. iPhone Safari에서 `공유 → 홈 화면에 추가` 후 독립 앱 화면으로 열리는지

## V3.6.0 Google Sheets 연동 검사

검사 시점: 2026-07-31

- 배포된 Apps Script GET 응답 정상
- Google Sheets 현장목록 74개 반환 확인
- 마지막 현장 ID 74, `휠라 물류센터` 확인
- Apps Script 응답의 `Access-Control-Allow-Origin: *` 확인
- 잘못된 신규 등록 요청이 현장명 필수 오류로 안전하게 거부되는지 확인
- `js/app.js` JavaScript 문법 검사 통과
- 백업 `data/sites.json` JSON 문법 및 74개 현장 확인
- 현장명·구분·주소·기타 메모 즉시 등록 UI 추가
- 거리·톨비·주유비가 없는 신규 현장에서는 빈 비용 영역을 숨기도록 처리
- 네이버지도·카카오맵 검색 링크와 티맵 앱 호출 연결
- 서비스 워커 캐시를 `total-eng-address-v3-6-0`으로 갱신

실제 데이터를 훼손하지 않기 위해 자동 검사에서는 가짜 현장을 등록하지 않았습니다. GitHub Pages 배포 후 실제 현장 한 건을 등록하여 Google Sheets의 `현장목록`과 `등록내역`에 동시에 추가되는지 최종 확인하세요.
