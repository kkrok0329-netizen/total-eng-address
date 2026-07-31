'use strict';

const APP_VERSION = 'V3.6.0';
const API_URL = 'https://script.google.com/macros/s/AKfycbyF2FyCA9Qqbqi90BCD-jE_LE_e-og2ty5sBOSgxVWydSCiB9fv3qOpmNpwsUlVxR54/exec';
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
  updatedText: $('updatedText')
  ,
  addSiteBtn: $('addSiteBtn'),
  siteFormModal: $('siteFormModal'),
  siteForm: $('siteForm'),
  closeSiteFormBtn: $('closeSiteFormBtn'),
  cancelSiteFormBtn: $('cancelSiteFormBtn'),
  saveSiteBtn: $('saveSiteBtn'),
  siteNameInput: $('siteNameInput'),
  siteTypeInput: $('siteTypeInput'),
  siteAddressInput: $('siteAddressInput'),
  siteNoteInput: $('siteNoteInput')
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

function hasTravelInfo(site) {
  return Boolean(cleanNumber(site.distance) || cleanNumber(site.toll) || cleanNumber(site.fuel));
}

function regionLabel(value) {
  if (!value) return '';
  const text = String(value);
  if (text.includes('서.경')) return '서울·경기';
  if (text.includes('지방')) return '지방';
  return text;
}

function regionClass(value) {
  if (!value) return '';
  return String(value).includes('지방') ? 'region-local' : 'region-capital';
}

function siteById(id) {
  const numericId = Number(id);
  return sites.find((site) => Number(site.id) === numericId);
}

async function loadData() {
  try {
    setLoading('불러오는 중...');
    let data;

    try {
      const apiResponse = await fetch(`${API_URL}?action=sites&_=${Date.now()}`, { cache: 'no-store' });
      if (!apiResponse.ok) throw new Error('Google Sheets 연결 실패');
      data = await apiResponse.json();
      if (!data.success || !Array.isArray(data.sites)) {
        throw new Error(data.error || '현장 데이터 형식 오류');
      }
    } catch (apiError) {
      console.warn('Google Sheets 데이터를 불러오지 못해 백업 데이터를 사용합니다.', apiError);
      const backupResponse = await fetch('./data/sites.json', { cache: 'no-cache' });
      if (!backupResponse.ok) throw new Error('백업 데이터도 불러오지 못했습니다.');
      data = await backupResponse.json();
      data.meta = { ...(data.meta || {}), source: '내장 백업' };
      toast('오프라인 백업 데이터를 표시합니다.');
    }

    meta = data.meta || {};
    sites = (Array.isArray(data.sites) ? data.sites : []).map((site) => ({
      ...site,
      id: Number(site.id),
      type: site.type === 'coupang' ? 'coupang' : 'general'
    }));

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
      [site.name, site.address, site.note, site.page, site.region]
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
  const region = isCoupang ? regionLabel(site.region || site.page) : '';
  const id = Number(site.id);

  return `<article class="site-card" data-action="open-detail" data-id="${id}" tabindex="0" aria-label="${escapeHtml(site.name)} 상세보기">
    <div class="card-head">
      <span class="type-badge ${isCoupang ? 'coupang' : ''}">${isCoupang ? '📦 쿠팡' : '🏗️ 일반현장'}</span>
      <button class="favorite-btn" type="button" data-action="toggle-favorite" data-id="${id}" aria-label="${isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}">${isFavorite ? '⭐' : '☆'}</button>
    </div>
    <div class="site-title">${escapeHtml(site.name)}</div>
    <div class="address">📍 ${escapeHtml(site.address)}</div>
    ${hasTravelInfo(site) ? `<div class="info-grid">
      <div class="info-box"><span>거리</span><strong>${distanceText(site)}</strong></div>
      <div class="info-box"><span>예상비용</span><strong>💰 ${totalCostText(site)}</strong></div>
      <div class="info-box"><span>주유비</span><strong>${money(site.fuel)}</strong></div>
    </div>` : ''}
    <div class="meta-row">
      ${site.toll ? `<span class="meta-chip">💳 톨비 ${money(site.toll)}</span>` : ''}
      ${site.note ? `<span class="meta-chip">📝 ${escapeHtml(site.note)}</span>` : ''}
      ${region ? `<span class="meta-chip ${regionClass(region)}">📍 ${escapeHtml(region)}</span>` : ''}
      ${!isCoupang && site.page ? `<span class="meta-chip">📖 PAGE ${escapeHtml(site.page)}</span>` : ''}
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
  const region = isCoupang ? regionLabel(site.region || site.page) : '';

  els.detailContent.innerHTML = `<span class="type-badge ${isCoupang ? 'coupang' : ''}">${isCoupang ? '📦 쿠팡' : '🏗️ 일반현장'}</span>
    <div class="detail-title">${escapeHtml(site.name)}</div>
    <div class="detail-address">📍 ${escapeHtml(site.address)}</div>
    ${hasTravelInfo(site) ? `<div class="info-grid">
      <div class="info-box"><span>거리</span><strong>${distanceText(site)}</strong></div>
      <div class="info-box"><span>톨비</span><strong>${money(site.toll)}</strong></div>
      <div class="info-box"><span>주유비</span><strong>${money(site.fuel)}</strong></div>
    </div>
    <div class="info-grid">
      <div class="info-box"><span>예상비용</span><strong>💰 ${totalCostText(site)}</strong></div>
      <div class="info-box"><span>구분</span><strong>${isCoupang ? '쿠팡' : '일반'}</strong></div>
      <div class="info-box"><span>${isCoupang ? '지역' : 'PAGE'}</span><strong>${escapeHtml(isCoupang ? (region || '-') : (site.page || '-'))}</strong></div>
    </div>` : ''}
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

function openSiteForm() {
  els.siteForm.reset();
  els.siteTypeInput.value = 'general';
  els.siteFormModal.classList.add('show');
  els.siteFormModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  window.setTimeout(() => els.siteNameInput.focus(), 50);
}

function closeSiteForm() {
  if (els.saveSiteBtn.disabled) return;
  els.siteFormModal.classList.remove('show');
  els.siteFormModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

async function saveSite(event) {
  event.preventDefault();

  const name = els.siteNameInput.value.trim();
  const address = els.siteAddressInput.value.trim();
  if (!name || !address) {
    toast('현장명과 주소를 입력해 주세요.');
    return;
  }

  els.saveSiteBtn.disabled = true;
  els.saveSiteBtn.textContent = '등록 중...';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveSite',
        site: {
          name,
          type: els.siteTypeInput.value,
          address,
          note: els.siteNoteInput.value.trim()
        }
      })
    });

    if (!response.ok) throw new Error('등록 서버에 연결하지 못했습니다.');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || '현장 등록에 실패했습니다.');

    els.siteFormModal.classList.remove('show');
    els.siteFormModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    els.searchInput.value = name;
    await loadData();
    toast('현장이 등록되었습니다.');
  } catch (error) {
    console.error(error);
    toast(error.message || '현장 등록에 실패했습니다.');
  } finally {
    els.saveSiteBtn.disabled = false;
    els.saveSiteBtn.textContent = '등록하기';
  }
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
  if (type === 'tmap') {
    const fallback = window.setTimeout(() => {
      const opened = window.open(`https://www.google.com/search?q=${query}+티맵`, '_blank');
      if (opened) opened.opener = null;
    }, 1200);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) window.clearTimeout(fallback);
    }, { once: true });
    window.location.href = `tmap://search?name=${query}`;
    return;
  }

  const urls = {
    naver: `https://map.naver.com/v5/search/${query}`,
    kakao: `https://map.kakao.com/link/search/${query}`
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

function updateInstallButton() {
  if (isStandalone()) {
    els.installBtn.hidden = true;
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
    if (event.key !== 'Escape') return;
    if (els.siteFormModal.classList.contains('show')) {
      closeSiteForm();
      return;
    }
    if (els.detailModal.classList.contains('show')) closeDetail();
  });

  els.darkModeBtn.addEventListener('click', () => applyDarkMode(!document.body.classList.contains('dark')));
  els.refreshBtn.addEventListener('click', loadData);
  els.installBtn.addEventListener('click', installApp);
  els.addSiteBtn.addEventListener('click', openSiteForm);
  els.closeSiteFormBtn.addEventListener('click', closeSiteForm);
  els.cancelSiteFormBtn.addEventListener('click', closeSiteForm);
  els.siteForm.addEventListener('submit', saveSite);
  els.siteFormModal.addEventListener('click', (event) => {
    if (event.target === els.siteFormModal) closeSiteForm();
  });

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
  loadData();
}

initialize();
