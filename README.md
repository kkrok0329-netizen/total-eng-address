# TOTAL ENG 현장주소 PWA V3.5.2

GitHub Pages에 바로 올릴 수 있도록 정리한 정적 PWA 버전입니다.

## 이번 수정 내용

- 스마트폰 현장 카드를 위아래로 압축했습니다.
- 카드 하단의 4개 버튼을 한 줄로 배치했습니다.
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
git commit -m "TOTAL ENG 현장주소 PWA V3.5.2 등록"
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
