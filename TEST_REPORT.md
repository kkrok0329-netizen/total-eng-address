# TOTAL ENG 현장주소 V3.6.4 테스트 보고서

## 변경 내용

- 현장 삭제 기능과 이중 확인
- Google Sheets 전체 목록 자동백업
- 최근 20개 스냅샷 유지
- 휴대폰 캐시 우선 표시 후 서버 갱신
- 앱과 캐시 버전 V3.6.4 갱신
- 버전별 최초 1회 업데이트 안내 팝업
- 새 Apps Script 주소의 삭제 요청 안전 거절 확인

## 자동 검사

- JavaScript와 Apps Script 문법
- HTML ID 중복과 JavaScript 요소 연결
- JSON 형식과 현장 수
- 서비스 워커 자산 목록
- Google Sheets `자동백업` 탭과 초기 전체 백업
- 기존 Google Apps Script GET 응답

## 배포 후 확인

- 새 Code.gs 배포 후 빈 ID 삭제 요청이 안전하게 거절되는지 확인
- 테스트 현장 삭제 후 `자동백업` 탭에 직전 전체 목록이 생기는지 확인
- 두 번째 실행부터 저장된 목록이 즉시 표시되는지 확인
