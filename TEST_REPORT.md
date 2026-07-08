# 테스트 결과 — V3.5.4

생성 시점: 2026-07-08

## 티맵 버튼 수정

- 기존 Google 검색 주소 제거 확인
- Android용 TMAP 앱 직접 호출 주소 생성 확인
- Android TMAP 패키지 ID `com.skt.tmap.ku` 확인
- Android에 TMAP이 없을 때 Google Play 설치 화면으로 이동하도록 설정 확인
- iPhone·iPad용 `tmap://search` 앱 호출 주소 확인
- iPhone·iPad에 TMAP이 없을 때 App Store 안내 기능 확인
- 현장 주소가 TMAP 검색어로 URL 인코딩되어 전달되는 것 확인
- 네이버지도와 카카오맵 연결 기능 유지 확인

## 기존 앱 기능 및 데이터

- 현장 73개 확인
- 일반현장 51개, 쿠팡 22개 확인
- 모든 현장 주소가 비어 있지 않은 것 확인
- 앱·HTML·데이터 버전 `V3.5.4` 일치 확인
- 서비스 워커 캐시 버전 `total-eng-address-v3-5-4` 확인

## 정적/PWA 검사

- JavaScript 문법 검사 통과
- 서비스 워커 JavaScript 문법 검사 통과
- `manifest.json` 및 `sites.json` JSON 검사 통과
- 192×192, 512×512, maskable 512×512 아이콘 크기 확인
- GitHub Pages 하위 경로 `/total-eng-address/`에서 주요 파일 HTTP 200 확인
- 총 45개 자동 검사 모두 통과

## 실제 스마트폰에서 확인할 내용

이 작업 환경에는 실제 TMAP 앱이 설치된 Android·iPhone 기기가 없어서 앱 전환 자체는 자동으로 실행할 수 없었습니다. GitHub에 V3.5.4를 올린 뒤 실제 스마트폰에서 티맵 버튼을 한 번 눌러 최종 확인해 주세요.

- Android: TMAP 앱의 주소 검색 화면이 열려야 합니다.
- iPhone: TMAP 앱의 주소 검색 화면이 열려야 합니다.
- TMAP이 설치되지 않은 기기는 앱 설치 화면으로 연결됩니다.
