'use strict';

const APP_VERSION = 'V3.5.3';
const STORAGE_KEYS = {
  favorites: 'tea_favorites',
  recentVisits: 'tea_recentVisits',
  recentSearches: 'tea_recentSearches',
  darkMode: 'tea_darkMode'
};

let sites = [];
let meta = {};
let currentType = 'all';
let deferredInstallPrompt = null;
let favorites = readStoredArray(STORAGE_KEYS.favorites);
let recentVisits = readStoredArray(STORAGE_KEYS.recentVisits);
let recentSearches = readStoredArray(STORAGE_KEYS.recentSearches);

const $ = (id) => document.getElementById(id);
const els = {
  splash: $('splash'),
  siteList: $('siteList'),
  searchInput: $('searchInput'),
  clearBtn: $('clearBtn'),
  countText: $('countText'),
  headerCount: $('headerCount'),
  favoriteTopBox: $('favoriteTopBox'),
  detailModal: $('detailModal'),
  detailContent: $('detailContent'),
  closeDetailBtn: $('closeDetailBtn'),
  darkModeBtn: $('darkModeBtn'),
  toast: $('toast'),
  refreshBtn: $('refreshBtn'),
  installBtn: $('installBtn'),
  versionText: $('versionText'),
  updatedText: $('updatedText'),
  kakaoGuide: $('kakaoGuide'),
  kakaoGuideMessage: $('kakaoGuideMessage'),
  kakaoAndroidSteps: $('kakaoAndroidSteps'),
  kakaoIosSteps: $('kakaoIosSteps'),
  openChromeBtn: $('openChromeBtn'),
  kakaoAndroidFallback: $('kakaoAndroidFallback'),
  copyAppLinkBtn: $('copyAppLinkBtn'),
  continueInKakaoBtn: $('continueInKakaoBtn')
};

function readStoredArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`저장 데이터 복구 실패: ${key}`, error);
    return [];
  }
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  localStorage.setItem(STORAGE_KEYS.recentVisits, JSON.stringify(recentVisits));
  localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(recentSearches));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanNumber(value) {
  const number = Number(String(value ?? '0').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function money(value) {
  if (value === '' || value === null || value === undefined) return '-';
  const number = cleanNumber(value);
  if (!number) return '-';
  return `${number.toLocaleString('ko-KR')}원`;
}

function distanceText(site) {
  return `🚗 사무실 ${escapeHtml(site.distance || '-')}km`;
}

function totalCost(site) {
  return cleanNumber(site.toll) + cleanNumber(site.fuel);
}

function totalCostText(site) {
  const cost = totalCost(site);
  return cost ? `${cost.toLocaleString('ko-KR')}원` : '-';
}

function siteById(id) {
  const numericId = Number(id);
  return sites.find((site) => Number(site.id) === numericId);
}

async function loadData() {
  try {
    setLoading('불러오는 중...');
    const response = await fetch('./data/sites.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('sites.json을 찾을 수 없습니다.');

    const data = await response.json();
    meta = data.meta || {};
    sites = Array.isArray(data.sites) ? data.sites : [];

    updateMeta();
    render();
  } catch (error) {
    console.error(error);
    els.siteList.innerHTML = '';
    const message = document.createElement('div');
    message.className = 'empty';
    message.textContent = `데이터를 불러오지 못했습니다. ${error.message}`;
    els.siteList.appendChild(message);
    setLoading('0개 현장');
  } finally {
    window.setTimeout(() => els.splash?.classList.add('hide'), 350);
  }
}

function setLoading(text) {
  if (els.headerCount) els.headerCount.textContent = text;
}

function updateMeta() {
  if (els.headerCount) els.headerCount.textContent = `${sites.length}개 현장`;
  if (els.versionText) els.versionText.textContent = APP_VERSION;
  if (els.updatedText) els.updatedText.textContent = `업데이트 ${meta.updatedAt || '-'}`;
}

function filteredSites() {
  const keyword = (els.searchInput.value || '').trim().toLowerCase();
  let data = [...sites];

  if (currentType === 'general') data = data.filter((site) => site.type === 'general');
  if (currentType === 'coupang') data = data.filter((site) => site.type === 'coupang');
  if (currentType === 'favorite') data = data.filter((site) => favorites.includes(site.id));
  if (currentType === 'recent') data = data.filter((site) => recentVisits.includes(site.id));

  if (keyword) {
    data = data.filter((site) => (
      [site.name, site.address, site.note]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    ));
  }

  if (currentType === 'recent') {
    data.sort((a, b) => recentVisits.indexOf(a.id) - recentVisits.indexOf(b.id));
  }

  return data;
}

function render() {
  const data = filteredSites();
  updateMeta();

  if (els.countText) els.countText.textContent = `전체 ${data.length}개`;
  renderFavoriteTop();
  els.siteList.innerHTML = '';

  if (!data.length) {
    els.siteList.innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
    return;
  }

  els.siteList.innerHTML = data.map(siteCard).join('');
}

function siteCard(site) {
  const isCoupang = site.type === 'coupang';
  const isFavorite = favorites.includes(site.id);
  const id = Number(site.id);

  return `<article class="site-card" data-action="open-detail" data-id="${id}" tabindex="0" aria-label="${escapeHtml(site.name)} 상세보기">
    <div class="card-head">
      <span class="type-badge ${isCoupang ? 'coupang' : ''}">${isCoupang ? '📦 쿠팡' : '🏗️ 일반현장'}</span>
      <button class="favorite-btn" type="button" data-action="toggle-favorite" data-id="${id}" aria-label="${isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}">${isFavorite ? '⭐' : '☆'}</button>
    </div>
    <div class="site-title">${escapeHtml(site.name)}</div>
    <div class="address">📍 ${escapeHtml(site.address)}</div>
    <div class="info-grid">
      <div class="info-box"><span>거리</span><strong>${distanceText(site)}</strong></div>
      <div class="info-box"><span>예상비용</span><strong>💰 ${totalCostText(site)}</strong></div>
      <div class="info-box"><span>주유비</span><strong>${money(site.fuel)}</strong></div>
    </div>
    <div class="meta-row">
      ${site.toll ? `<span class="meta-chip">💳 톨비 ${money(site.toll)}</span>` : ''}
      ${site.note ? `<span class="meta-chip">📝 ${escapeHtml(site.note)}</span>` : ''}
      ${site.warranty ? `<span class="meta-chip">🛡 ${escapeHtml(site.warranty)}</span>` : ''}
    </div>
    <div class="card-buttons">
      <button type="button" data-action="copy" data-id="${id}">📋 주소복사</button>
      <button type="button" data-action="map" data-map="tmap" data-id="${id}">🚗 티맵</button>
      <button type="button" data-action="map" data-map="kakao" data-id="${id}">카카오내비</button>
      <button type="button" data-action="map" data-map="naver" data-id="${id}">네이버지도</button>
    </div>
  </article>`;
}

function renderFavoriteTop() {
  if (!els.favoriteTopBox) return;

  const favoriteSites = sites.filter((site) => favorites.includes(site.id)).slice(0, 10);
  if (!favoriteSites.length) {
    els.favoriteTopBox.classList.remove('show');
    els.favoriteTopBox.innerHTML = '';
    return;
  }

  els.favoriteTopBox.classList.add('show');
  els.favoriteTopBox.innerHTML = `<div class="favorite-top-title">⭐ 즐겨찾기 현장</div>
    <div class="favorite-top-list">
      ${favoriteSites.map((site) => `<button class="favorite-chip" type="button" data-action="open-detail" data-id="${Number(site.id)}">
        <strong>⭐ ${escapeHtml(site.name)}</strong>
        <span>${distanceText(site)}</span>
      </button>`).join('')}
    </div>`;
}

function toggleFavorite(id) {
  const numericId = Number(id);
  favorites = favorites.includes(numericId)
    ? favorites.filter((value) => value !== numericId)
    : [numericId, ...favorites];
  saveStorage();
  render();
}

function openDetail(id) {
  const site = siteById(id);
  if (!site) return;

  const numericId = Number(site.id);
  recentVisits = [numericId, ...recentVisits.filter((value) => value !== numericId)].slice(0, 20);
  saveStorage();

  const isCoupang = site.type === 'coupang';

  els.detailContent.innerHTML = `<span class="type-badge ${isCoupang ? 'coupang' : ''}">${isCoupang ? '📦 쿠팡' : '🏗️ 일반현장'}</span>
    <div class="detail-title">${escapeHtml(site.name)}</div>
    <div class="detail-address">📍 ${escapeHtml(site.address)}</div>
    <div class="info-grid">
      <div class="info-box"><span>거리</span><strong>${distanceText(site)}</strong></div>
      <div class="info-box"><span>톨비</span><strong>${money(site.toll)}</strong></div>
      <div class="info-box"><span>주유비</span><strong>${money(site.fuel)}</strong></div>
    </div>
    <div class="info-grid detail-summary-grid">
      <div class="info-box"><span>예상비용</span><strong>💰 ${totalCostText(site)}</strong></div>
      <div class="info-box"><span>구분</span><strong>${isCoupang ? '쿠팡' : '일반'}</strong></div>
    </div>
    <div class="meta-row">
      ${site.note ? `<span class="meta-chip">📝 ${escapeHtml(site.note)}</span>` : ''}
      ${site.warranty ? `<span class="meta-chip">🛡 Warranty ${escapeHtml(site.warranty)}</span>` : ''}
    </div>
    <div class="detail-buttons">
      <button class="btn-copy" type="button" data-action="copy" data-id="${numericId}">📋 주소복사</button>
      <button class="btn-tmap" type="button" data-action="map" data-map="tmap" data-id="${numericId}">🚗 티맵</button>
      <button class="btn-kakao" type="button" data-action="map" data-map="kakao" data-id="${numericId}">카카오내비</button>
      <button class="btn-naver" type="button" data-action="map" data-map="naver" data-id="${numericId}">네이버지도</button>
    </div>`;

  els.detailModal.classList.add('show');
  els.detailModal.setAttribute('aria-hidden', 'false');
  els.closeDetailBtn.focus();
}

function closeDetail() {
  els.detailModal.classList.remove('show');
  els.detailModal.setAttribute('aria-hidden', 'true');
}

function toast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add('show');
  window.setTimeout(() => els.toast.classList.remove('show'), 1800);
}

async function copyAddress(id) {
  const site = siteById(id);
  if (!site) return;

  try {
    await navigator.clipboard.writeText(site.address);
    toast('주소가 복사되었습니다.');
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = site.address;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    toast(copied ? '주소가 복사되었습니다.' : '주소 복사에 실패했습니다.');
  }
}

function openMap(id, type) {
  const site = siteById(id);
  if (!site) return;

  const query = encodeURIComponent(site.address);
  const urls = {
    naver: `https://map.naver.com/v5/search/${query}`,
    kakao: `https://map.kakao.com/link/search/${query}`,
    tmap: `https://www.google.com/search?q=${query}+티맵`
  };

  const url = urls[type];
  if (!url) return;

  const opened = window.open(url, '_blank');
  if (opened) {
    opened.opener = null;
  } else {
    toast('팝업 차단을 해제해 주세요.');
  }
}

function handleAction(event) {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;

  const action = actionTarget.dataset.action;
  const id = actionTarget.dataset.id;

  if (action === 'toggle-favorite') {
    event.stopPropagation();
    toggleFavorite(id);
    return;
  }

  if (action === 'copy') {
    event.stopPropagation();
    copyAddress(id);
    return;
  }

  if (action === 'map') {
    event.stopPropagation();
    openMap(id, actionTarget.dataset.map);
    return;
  }

  if (action === 'open-detail') {
    openDetail(id);
  }
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(window.navigator.userAgent);
}

function isKakaoInAppBrowser() {
  return /kakaotalk/i.test(window.navigator.userAgent || '');
}

function showKakaoGuide() {
  if (!els.kakaoGuide || isStandalone()) return;

  const ios = isIos();
  els.kakaoGuide.hidden = false;
  els.kakaoGuide.setAttribute('aria-hidden', 'false');
  document.body.classList.add('kakao-guide-open');

  if (els.kakaoAndroidSteps) els.kakaoAndroidSteps.hidden = ios;
  if (els.kakaoIosSteps) els.kakaoIosSteps.hidden = !ios;
  if (els.openChromeBtn) els.openChromeBtn.hidden = ios || !isAndroid();
  if (els.kakaoAndroidFallback) els.kakaoAndroidFallback.hidden = ios || !isAndroid();

  if (els.kakaoGuideMessage) {
    els.kakaoGuideMessage.textContent = ios
      ? 'Safari에서 열면 홈 화면에 앱으로 추가할 수 있어요.'
      : '아래 버튼을 누르면 Chrome에서 설치할 수 있어요.';
  }

  window.setTimeout(() => {
    const focusTarget = ios ? els.copyAppLinkBtn : els.openChromeBtn;
    focusTarget?.focus();
  }, 50);
}

function hideKakaoGuide() {
  if (!els.kakaoGuide) return;
  els.kakaoGuide.hidden = true;
  els.kakaoGuide.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('kakao-guide-open');
}

function openInChrome() {
  const currentUrl = window.location.href;

  if (!isAndroid()) {
    copyCurrentAppLink();
    return;
  }

  const protocol = window.location.protocol.replace(':', '') || 'https';
  const path = `${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`;
  const fallbackUrl = encodeURIComponent(currentUrl);
  window.location.href = `intent://${path}#Intent;scheme=${protocol};package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;
}

async function copyCurrentAppLink() {
  const currentUrl = window.location.href;

  try {
    await navigator.clipboard.writeText(currentUrl);
    toast('앱 주소를 복사했습니다.');
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = currentUrl;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    toast(copied ? '앱 주소를 복사했습니다.' : '주소를 길게 눌러 복사해 주세요.');
  }
}

function updateInstallButton() {
  if (isStandalone()) {
    els.installBtn.hidden = true;
    return;
  }

  if (isKakaoInAppBrowser()) {
    els.installBtn.textContent = '설치안내';
    els.installBtn.hidden = false;
    return;
  }

  if (deferredInstallPrompt) {
    els.installBtn.textContent = '설치';
    els.installBtn.hidden = false;
    return;
  }

  if (isIos()) {
    els.installBtn.textContent = '설치안내';
    els.installBtn.hidden = false;
  }
}

async function installApp() {
  if (isKakaoInAppBrowser()) {
    showKakaoGuide();
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    updateInstallButton();
    return;
  }

  if (isIos()) {
    window.alert('Safari의 공유 버튼을 누른 뒤 “홈 화면에 추가”를 선택하세요.');
    return;
  }

  toast('브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택하세요.');
}

function applyDarkMode(enabled) {
  document.body.classList.toggle('dark', enabled);
  els.darkModeBtn.textContent = enabled ? '☀️' : '🌙';
  els.darkModeBtn.setAttribute('aria-label', enabled ? '다크모드 끄기' : '다크모드 켜기');
  localStorage.setItem(STORAGE_KEYS.darkMode, enabled ? '1' : '0');
}

function initEvents() {
  els.searchInput.addEventListener('input', render);
  els.searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const keyword = els.searchInput.value.trim();
    if (!keyword) return;
    recentSearches = [keyword, ...recentSearches.filter((value) => value !== keyword)].slice(0, 10);
    saveStorage();
  });

  els.clearBtn.addEventListener('click', () => {
    els.searchInput.value = '';
    els.searchInput.focus();
    render();
  });

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      currentType = tab.dataset.type;
      render();
    });
  });

  els.siteList.addEventListener('click', handleAction);
  els.favoriteTopBox.addEventListener('click', handleAction);
  els.detailContent.addEventListener('click', handleAction);

  els.siteList.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.site-card');
    if (!card || event.target.closest('button')) return;
    event.preventDefault();
    openDetail(card.dataset.id);
  });

  els.closeDetailBtn.addEventListener('click', closeDetail);
  els.detailModal.addEventListener('click', (event) => {
    if (event.target === els.detailModal) closeDetail();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && els.detailModal.classList.contains('show')) closeDetail();
  });

  els.darkModeBtn.addEventListener('click', () => applyDarkMode(!document.body.classList.contains('dark')));
  els.refreshBtn.addEventListener('click', loadData);
  els.installBtn.addEventListener('click', installApp);
  els.openChromeBtn?.addEventListener('click', openInChrome);
  els.copyAppLinkBtn?.addEventListener('click', copyCurrentAppLink);
  els.continueInKakaoBtn?.addEventListener('click', hideKakaoGuide);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    els.installBtn.hidden = true;
    toast('앱이 설치되었습니다.');
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
      registration.update().catch(() => {});
    } catch (error) {
      console.warn('서비스 워커 등록 실패', error);
    }
  });
}

function initialize() {
  const storedDarkMode = localStorage.getItem(STORAGE_KEYS.darkMode) === '1';
  applyDarkMode(storedDarkMode);
  initEvents();
  registerServiceWorker();
  updateInstallButton();
  if (isKakaoInAppBrowser()) showKakaoGuide();
  loadData();
}

initialize();
