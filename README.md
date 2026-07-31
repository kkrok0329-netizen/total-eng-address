# TOTAL ENG 현장주소 PWA

GitHub Pages에 바로 올릴 수 있도록 정리한 정적 PWA 버전입니다.

## 중요 보안 안내

이 프로젝트의 `data/sites.json`에는 현장 주소와 비용 정보가 들어 있습니다. 공개 GitHub 저장소와 일반 GitHub Pages에 게시하면 링크를 아는 외부인이 파일을 열 수 있습니다. `robots.txt`와 `noindex` 설정은 검색엔진 노출을 줄일 뿐 접근을 차단하지 않습니다.

회사 내부 전용이어야 한다면 공개 배포 전에 회사 IT 담당자와 비공개 호스팅, 사내 로그인, VPN 또는 접근 제어 방식을 확인하세요.

## GitHub 업로드

1. GitHub에서 빈 저장소를 만듭니다. 예: `total-eng-address`
2. 이 폴더를 VS Code로 엽니다.
3. VS Code 터미널에서 아래 명령을 순서대로 실행합니다.

```bash
git init
git branch -M main
git add .
git commit -m "TOTAL ENG 현장주소 PWA 등록"
git remote add origin https://github.com/사용자이름/total-eng-address.git
git push -u origin main
```

4. GitHub 저장소에서 `Settings → Pages`로 이동합니다.
5. `Source`를 `Deploy from a branch`로 설정합니다.
6. `Branch`는 `main`, 폴더는 `/(root)`를 선택하고 저장합니다.
7. 잠시 후 표시되는 `Visit site` 주소에서 앱을 확인합니다.

## 스마트폰 설치

### Android

Chrome에서 GitHub Pages 주소를 연 뒤 메뉴에서 `앱 설치` 또는 `홈 화면에 추가`를 선택합니다.

### iPhone/iPad

Safari에서 GitHub Pages 주소를 연 뒤 `공유 → 홈 화면에 추가`를 선택합니다.

## 현장 데이터 등록

V3.6.0부터 앱은 Google Sheets의 `현장목록`을 실시간으로 읽습니다.

직원은 앱의 `현장 등록` 버튼을 눌러 아래 정보만 입력하면 됩니다.

- 현장명
- 일반현장/쿠팡 구분
- 주소
- 기타 메모(선택)

저장한 현장은 승인 절차 없이 즉시 Google Sheets와 전 직원 앱에 반영됩니다. 거리, 톨비, 주유비는 입력하지 않아도 되며 주소복사와 네이버지도, 카카오맵, 티맵 연결은 정상적으로 사용할 수 있습니다.

인터넷 또는 Google Sheets 연결이 일시적으로 끊기면 앱에 포함된 `data/sites.json`을 읽기 전용 백업으로 표시합니다. 백업 상태에서는 신규 등록이 되지 않습니다.

### 등록 권한 주의

현재 웹 앱은 로그인과 승인 절차 없이 즉시 등록하도록 구성되어 있습니다. GitHub Pages 주소 또는 Apps Script 주소를 아는 사람은 현장을 등록할 수 있으므로 앱 주소는 회사 직원에게만 전달하세요. 외부인의 등록까지 기술적으로 차단해야 한다면 공유 등록 비밀번호나 직원 로그인을 추가해야 합니다.

앱 화면이나 기능을 수정한 경우에만 GitHub 파일을 다시 올리고, `service-worker.js`의 `CACHE_NAME`도 새 버전으로 변경하세요.

## 로컬 테스트

VS Code Live Server로 `index.html`을 열거나, 프로젝트 상위 폴더에서 다음 명령을 실행합니다.

```bash
python -m http.server 5500
```

브라우저에서 프로젝트 폴더 경로를 포함한 주소로 접속합니다.
