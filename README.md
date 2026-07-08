# TOTAL ENG 현장주소 PWA V3.5.6

GitHub Pages에 바로 올릴 수 있도록 정리한 정적 PWA 버전입니다.

## 이번 수정 내용

- 카카오톡 감지를 `index.html` 안에서도 즉시 실행해, 오래된 JavaScript 캐시가 남아 있어도 안내 화면이 뜨도록 보강했습니다.
- 카카오톡 전용 공유주소 `?from=kakao`를 지원합니다. 이 주소를 공유하면 User-Agent 감지가 실패해도 안내 화면이 표시됩니다.
- CSS와 JavaScript 주소에 버전 번호를 붙여 이전 캐시가 새 화면을 막지 않도록 했습니다.
- 서비스 워커의 핵심 파일을 네트워크 우선으로 변경해 업데이트 반영을 빠르게 했습니다.

- 카카오톡 링크로 접속하면 큰 설치 안내 화면이 자동으로 표시됩니다.
- Android에서는 `Chrome으로 열기` 버튼을 제공합니다.
- iPhone에서는 `Safari로 열기 → 공유 → 홈 화면에 추가` 순서를 크게 안내합니다.
- 안내 화면에서 앱 주소 복사와 `설치하지 않고 일단 사용하기`도 선택할 수 있습니다.
- 상단 설치 버튼은 카카오톡에서 `설치안내`로 표시됩니다.

- 스마트폰 현장 카드를 위아래로 압축했습니다.
- 카드 하단에 주소복사·티맵·카카오내비·네이버지도·현대차·기아차 버튼을 3개씩 두 줄로 배치했습니다.
- 긴 현장명은 한 줄 말줄임, 긴 주소는 최대 두 줄로 표시합니다.
- 카드의 추가정보는 가로 스크롤 한 줄로 표시해 카드 높이가 늘어나지 않도록 했습니다.
- 앱 화면과 상세화면에서 `PAGE` 정보를 모두 제거했습니다.
- `data/sites.json`에서 `page`, `region` 필드를 제거했습니다.
- `data/address.xlsx`의 원래 I열과 U열에 있던 PAGE 열을 삭제했습니다.
- Excel에서 PAGE 열 삭제 후 쿠팡 표는 L~S열에 배치했습니다.

## 중요 보안 안내

이 프로젝트의 `data/sites.json`과 `data/address.xlsx`에는 현장 주소와 비용 정보가 들어 있습니다. 공개 GitHub 저장소와 일반 GitHub Pages에 게시하면 링크를 아는 외부인이 파일을 열 수 있습니다. `robots.txt`와 `noindex` 설정은 검색엔진 노출을 줄일 뿐 접근을 차단하지 않습니다.

회사 내부 전용이어야 한다면 공개 배포 전에 회사 IT 담당자와 비공개 호스팅, 사내 로그인, VPN 또는 접근 제어 방식을 확인하세요.

## GitHub 업로드

1. GitHub에서 빈 저장소를 만듭니다. 예: `total-eng-address`
2. 이 폴더를 VS Code로 엽니다.
3. VS Code 터미널에서 아래 명령을 순서대로 실행합니다.

```bash
git init
git branch -M main
git add .
git commit -m "TOTAL ENG 현장주소 PWA V3.5.6 등록"
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

## 현장 데이터 수정

앱은 실제 표시용 데이터로 `data/sites.json`을 읽습니다. `data/address.xlsx`는 수정·관리용 원본으로 함께 넣었습니다.

Excel만 변경하면 앱 화면은 자동으로 바뀌지 않습니다. Excel 수정 내용을 `sites.json`에도 반영한 뒤 아래 명령을 실행해야 합니다.

```bash
git add .
git commit -m "현장 정보 업데이트"
git push
```

서비스 워커 캐시 구조를 변경했다면 `service-worker.js`의 `CACHE_NAME`도 새 버전으로 변경하세요.

## 로컬 테스트

VS Code Live Server로 `index.html`을 열거나, 프로젝트 상위 폴더에서 다음 명령을 실행합니다.

```bash
python -m http.server 5500
```

브라우저에서 프로젝트 폴더 경로를 포함한 주소로 접속합니다.


## 기존 GitHub 저장소 업데이트

이미 `total-eng-address` 저장소와 Pages 주소가 있다면 새 저장소를 만들 필요가 없습니다.
이 폴더 안의 파일을 기존 저장소에 다시 업로드하고 `Commit changes`를 누르세요.
기존 주소는 그대로 유지됩니다.

카카오톡에서 변경 전 화면이 계속 보이면 앱 또는 카카오톡 화면을 완전히 닫은 뒤 다시 열어 주세요.

## V3.5.6 변경 사항

- Google 지도 버튼은 넣지 않았습니다.
- 기존 `티맵`, `카카오내비`, `네이버지도` 버튼은 유지했습니다.
- `현대차` 버튼을 추가했습니다. 누르면 현장주소를 먼저 복사하고 마이현대 앱 실행을 시도합니다.
- `기아차` 버튼을 추가했습니다. 누르면 현장주소를 먼저 복사하고 Kia App 실행을 시도합니다.
- Android에서 앱이 없으면 각 앱의 Google Play 설치 화면으로 연결됩니다.
- iPhone은 공개된 직접 실행용 링크가 확인되지 않아 App Store 페이지로 연결합니다. 앱이 설치되어 있으면 App Store의 `열기`를 누를 수 있습니다.
- 차량 앱 안에서는 복사된 주소를 검색창에 붙여넣고 차량 전송 기능을 선택합니다.
- 차량 등록과 커넥티드 서비스 가입 여부에 따라 차량 전송 메뉴가 다르거나 지원되지 않을 수 있습니다.

## 카카오톡에 공유할 권장 주소

```text
https://kkrok0329-netizen.github.io/total-eng-address/?from=kakao
```

이 주소는 카카오톡 인앱브라우저 감지의 보조장치입니다. Chrome으로 이동할 때는 `from=kakao`가 자동으로 제거됩니다.
