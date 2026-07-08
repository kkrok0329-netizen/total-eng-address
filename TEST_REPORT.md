# TOTAL ENG 현장주소 V3.5.5 테스트 보고서

## 결과
- 통과: **24/24**
- 실패: **0**

## 핵심 확인

- 일반 Chrome에서는 카카오톡 안내창이 자동으로 뜨지 않음
- Android 카카오톡 User-Agent에서는 큰 안내창이 자동 표시됨
- iPhone 카카오톡 User-Agent에서는 Safari 설치 안내가 자동 표시됨
- `?from=kakao` 공유주소에서는 User-Agent와 관계없이 안내창이 표시됨
- `Chrome으로 열기` 또는 링크 복사 시 `from=kakao` 값이 제거됨
- 현장 카드 73개 로딩 확인
- 기존 TMAP 직접 열기 코드 유지
- JavaScript/CSS에 버전 주소를 적용해 오래된 캐시를 우회
- 서비스 워커 핵심 파일을 네트워크 우선으로 변경

## 세부 검사

- 통과: JavaScript 문법 검사
- 통과: manifest.json JSON 검사
- 통과: sites.json JSON 검사
- 통과: 현장 73개
- 통과: 화면 버전 V3.5.5
- 통과: 앱 코드 버전 V3.5.5
- 통과: 서비스 워커 캐시 V3.5.5
- 통과: 카카오 UA 감지
- 통과: 카카오 공유주소 강제 감지
- 통과: index.html 즉시 감지 스크립트
- 통과: JS/CSS 캐시 무효화
- 통과: 서비스 워커 네트워크 우선
- 통과: 서비스 워커 캐시 우회 갱신
- 통과: TMAP 직접 호출 유지
- 통과: HTML 내부 파일 경로
- 통과: 필수 파일: index.html
- 통과: 필수 파일: style.css
- 통과: 필수 파일: js/app.js
- 통과: 필수 파일: service-worker.js
- 통과: 필수 파일: manifest.json
- 통과: 필수 파일: data/sites.json
- 통과: 필수 파일: img/icon-192.png
- 통과: 필수 파일: img/icon-512.png
- 통과: 브라우저 모의 테스트

## 실제 기기에서 마지막으로 확인할 내용

- GitHub 업로드 후 화면 아래 버전이 `V3.5.5`인지 확인
- 카카오톡에서 `https://kkrok0329-netizen.github.io/total-eng-address/?from=kakao`를 눌러 큰 안내창 확인
- Android에서 `Chrome으로 열기` 버튼 확인
- 실제 TMAP 앱 전환 확인

자동 테스트 환경에는 실제 카카오톡 및 TMAP 앱이 설치되어 있지 않아 앱 간 전환 자체는 스마트폰에서 최종 확인해야 합니다.
