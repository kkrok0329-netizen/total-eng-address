'use strict';
(() => {
  const q = id => document.getElementById(id);
  const departments = globalThis.ContactDepartments;
  const preview = new URLSearchParams(location.search).get('preview') === 'departments';
  let selectedDepartment = '전체';
  const categoryKey = value => String(value || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  function categoryLabels() {
    const labels = new Map(['우리회사', '현장'].map(label => [categoryKey(label), label]));
    for (const contact of contacts) {
      const label = String(contact.category === '협력사' ? contact.company : contact.category).trim().replace(/\s+/g, ' ');
      if (label && !labels.has(categoryKey(label))) labels.set(categoryKey(label), label);
    }
    return [...labels.values()];
  }
  const cacheKey = 'tea_shared_contacts_v1';
  let contacts = [], category = '전체', busy = false, loaded = false, revision = '', supportsDepartments = false;
  try { const c = JSON.parse(localStorage.getItem(cacheKey) || 'null'); if (Array.isArray(c?.contacts)) contacts = c.contacts; } catch (_) {}
  const editor = document.createElement('dialog');
  editor.className = 'contact-editor';
  editor.setAttribute('aria-labelledby', 'contactEditorTitle');
  editor.innerHTML = `<form id="contactForm"><div class="contacts-toolbar"><h2 id="contactEditorTitle">연락처 추가</h2><button type="button" id="closeContactBtn" aria-label="연락처 편집 닫기">✕</button></div>
    <input name="id" type="hidden"><input name="updatedAt" type="hidden">
    <label>업체·분류 *<input name="category" required maxlength="120" list="contactCategoryOptions" placeholder="업체명 직접 입력 또는 기존 항목 선택"><datalist id="contactCategoryOptions"></datalist></label>
    <label id="contactDepartmentField" hidden>부서<select name="department"><option value="">부서 미지정</option>${departments.names.map(name => `<option>${name}</option>`).join('')}</select></label>
    <label>이름 *<input name="name" required maxlength="80" autocomplete="name"></label>
    <label>전화번호 *<input name="phone" type="tel" required maxlength="30" autocomplete="tel" placeholder="010-1234-5678"></label>
    <label>업체명<input name="company" maxlength="120" placeholder="TOTAL ENG / 협력업체명"></label>
    <label>직책<input name="position" maxlength="80" placeholder="과장 / 시설팀장 / 대표"></label>
    <label>현장명<input name="siteName" maxlength="120" list="contactSiteOptions" placeholder="휠라 물류센터"></label><datalist id="contactSiteOptions"></datalist>
    <label>메모<textarea name="note" maxlength="500" rows="3" placeholder="담당 업무, 연락 참고사항"></textarea></label>
    <p>저장하면 모든 직원에게 공유됩니다.</p><div class="contact-actions"><button id="deleteContactBtn" type="button">삭제</button><button type="submit" id="saveContactBtn">공용 주소록에 저장</button></div></form>`;
  document.body.appendChild(editor);
  const form = q('contactForm');
  const field = name => form.elements.namedItem(name);
  const phoneDigits = value => String(value || '').replace(/\D/g, '');
  const contactCategory = contact => {
    const label = contact.category === '협력사' ? contact.company : contact.category;
    return categoryLabels().find(c => categoryKey(c) === categoryKey(label)) || label;
  };
  function matches(contact, query) {
    const target = normalizeSearchText([contact.name, contact.company, contact.position, contact.siteName, contact.phone, contact.note, contact.category, departments.get(contact)].join(' '));
    return String(query).trim().split(/\s+/).map(normalizeSearchText).filter(Boolean).every(word => target.includes(word));
  }
  function renderContacts() {
    const labels = categoryLabels();
    if (category !== '전체' && !labels.some(c => categoryKey(c) === categoryKey(category))) category = '전체';
    const scrollLeft = q('contactFilters').scrollLeft;
    q('contactFilters').innerHTML = ['전체', ...labels].map(c => `<button type="button" data-category="${escapeHtml(c)}" class="${categoryKey(c) === categoryKey(category) ? 'selected' : ''}" aria-pressed="${categoryKey(c) === categoryKey(category)}">${escapeHtml(c)}</button>`).join('');
    q('contactFilters').scrollLeft = scrollLeft;
    const companySelected = categoryKey(category) === categoryKey('우리회사');
    q('departmentPanel').hidden = !companySelected;
    const companyContacts = contacts.filter(c => departments.isCompany(c));
    if (companySelected) {
      q('departmentFilters').innerHTML = ['전체', ...departments.names].map(name => {
        const count = name === '전체' ? companyContacts.length : companyContacts.filter(c => departments.get(c) === name).length;
        return `<button type="button" data-department="${escapeHtml(name)}" class="${selectedDepartment === name ? 'selected' : ''}" aria-pressed="${selectedDepartment === name}">${escapeHtml(name)}<span>${count}</span></button>`;
      }).join('');
      const unassigned = companyContacts.filter(c => !departments.get(c)).length;
      q('departmentHint').textContent = unassigned ? `부서 미지정 ${unassigned}명 · 전체에서 확인 후 연락처 수정에서 부서를 지정할 수 있습니다.` : '부서를 선택하면 해당 부서의 연락처만 표시됩니다.';
    }
    const filtered = contacts.filter(c => (category === '전체' || categoryKey(contactCategory(c)) === categoryKey(category)) && (!companySelected || departments.matches(c, selectedDepartment)) && matches(c, q('contactSearch').value))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'));
    q('contactCount').textContent = `${category}${companySelected && selectedDepartment !== '전체' ? ' · ' + selectedDepartment : ''} ${filtered.length}명`;
    q('contactList').innerHTML = filtered.map(c => {
      const digits = (String(c.phone || '').trim().startsWith('+') ? '+' : '') + phoneDigits(c.phone);
      return `<article class="contact-card"><div class="contacts-toolbar"><span class="contact-badge">${escapeHtml(contactCategory(c))}</span><button type="button" data-edit="${escapeHtml(c.id)}" aria-label="${escapeHtml(c.name)} 수정">✎ 수정</button></div>
        <h3>${escapeHtml(c.name)} <small>${escapeHtml(c.position)}</small></h3>
        ${departments.isCompany(c) ? `<p class="contact-department">부서 · ${escapeHtml(departments.get(c) || '부서 미지정')}</p>` : ''}
        ${c.company ? `<p>업체 · ${escapeHtml(c.company)}</p>` : ''}${c.siteName ? `<p>현장 · ${escapeHtml(c.siteName)}</p>` : ''}
        <p>${escapeHtml(c.phone)}</p>${c.note ? `<p class="contact-note">${escapeHtml(c.note)}</p>` : ''}
        <div class="contact-actions">${digits ? `<a href="tel:${digits}" aria-label="${escapeHtml(c.name)}에게 전화">📞 전화</a><a href="sms:${digits}" aria-label="${escapeHtml(c.name)}에게 문자">💬 문자</a>` : '<span>전화번호를 확인해 주세요.</span>'}</div></article>`;
    }).join('') || (companySelected && selectedDepartment !== '전체' ? `<p class="empty">${escapeHtml(selectedDepartment)}에 배정된 연락처가 없습니다.<br>소속 명단을 받으면 여기에 표시됩니다.</p>` : '<p class="empty">연락처가 없습니다.<br>검색어나 분류를 바꾸거나 연락처를 추가해 주세요.</p>');
  }
  async function request(action, body) {
    if (preview && body) throw new Error('부서 필터 미리보기에서는 저장하지 않습니다.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = body ? await fetch(API_URL, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action, ...body}), signal:controller.signal})
        : await fetch(preview ? `./preview-contacts?_=${Date.now()}` : `${API_URL}?action=${action}&_=${Date.now()}`, {cache:'no-store', signal:controller.signal});
      if (!response.ok) throw new Error('서버 연결 실패');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || '주소록 서버 업데이트가 필요합니다.');
      return data;
    } finally { clearTimeout(timer); }
  }
  async function refresh() {
    q('contactStatus').textContent = '공용 주소록 확인 중…';
    try {
      const data = await request('contacts');
      if (!Array.isArray(data.contacts)) throw new Error('주소록 서버 업데이트가 필요합니다.');
      contacts = data.contacts; revision = data.revision || ''; loaded = true; supportsDepartments = data.features?.departments === true;
      try { localStorage.setItem(cacheKey, JSON.stringify({contacts})); } catch (_) {}
      q('contactStatus').textContent = '최신 공용 주소록 · 직원 전체 공유';
      renderContacts();
    } catch (error) {
      loaded = false;
      const reason = error.name === 'AbortError' ? '서버 응답 시간 초과' : error instanceof TypeError ? '네트워크 연결 실패' : error instanceof SyntaxError ? '서버 응답 확인 필요 · 배포 접근 권한을 확인해 주세요' : error.message;
      q('contactStatus').textContent = `${contacts.length ? '저장된 주소록 표시 중' : '주소록 연결 실패'} · ${reason} · 새로고침으로 재시도`;
    }
  }
  function openEditor(contact) {
    if (preview) { toast('읽기 전용 미리보기입니다. 연락처는 변경하지 않습니다.'); return; }
    if (!loaded) { toast('주소록을 새로고침해 서버에 연결한 후 편집해 주세요.'); return; }
    form.reset();
    for (const key of ['id','updatedAt','name','phone','company','position','siteName','note','department']) field(key).value = contact?.[key] || '';
    const savedCategory = contact?.category === '협력사' ? contact.company : contact?.category;
    field('category').value = savedCategory || (category === '전체' ? '우리회사' : category);
    updateDepartmentField();
    q('contactCategoryOptions').innerHTML = categoryLabels().map(c => `<option value="${escapeHtml(c)}"></option>`).join('');
    q('contactEditorTitle').textContent = contact ? '연락처 수정' : '연락처 추가';
    q('deleteContactBtn').hidden = !contact;
    q('contactSiteOptions').innerHTML = sites.map(s => `<option value="${escapeHtml(s.name)}"></option>`).join('');
    editor.showModal();
  }
  function setBusy(value) {
    busy = value;
    for (const el of form.elements) el.disabled = value;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    const contact = Object.fromEntries(new FormData(form));
    for (const key in contact) contact[key] = String(contact[key]).trim();
    contact.category = categoryLabels().find(c => categoryKey(c) === categoryKey(contact.category)) || contact.category.replace(/\s+/g, ' ');
    if (!departments.isCompany(contact)) delete contact.department;
    else if (!supportsDepartments) { toast('부서 저장을 위해 Apps Script V3.8.0을 먼저 배포해 주세요.'); return; }
    if (!categoryKey(contact.category) || ['전체', '협력사'].includes(contact.category)) { toast('실제 업체명 또는 우리회사·현장 분류를 입력해 주세요.'); return; }
    const digits = phoneDigits(contact.phone);
    if (digits.length < 7 || digits.length > 15) { toast('전화번호를 확인해 주세요.'); return; }
    if (contacts.some(c => String(c.id) !== contact.id && phoneDigits(c.phone) === digits) && !confirm('같은 전화번호가 이미 있습니다. 그래도 저장할까요?')) return;
    setBusy(true);
    try { await request('saveContact', {contact, revision}); editor.close(); toast('연락처를 공용 주소록에 저장했습니다.'); await refresh(); }
    catch(error) { alert(`${error.message}\n입력 내용은 유지됩니다. 연결 오류라면 주소록을 확인한 후 다시 저장해 주세요.`); }
    finally { setBusy(false); }
  });
  q('deleteContactBtn').addEventListener('click', async () => {
    if (busy || !confirm(`“${field('name').value}” 연락처를 모든 직원의 주소록에서 삭제할까요? 삭제 전 정보는 백업됩니다.`)) return;
    setBusy(true);
    try { await request('deleteContact', {contact:{id:field('id').value, updatedAt:field('updatedAt').value}, revision}); editor.close(); toast('연락처가 삭제됐습니다.'); await refresh(); }
    catch(error) { alert(error.message); } finally { setBusy(false); }
  });
  editor.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  q('closeContactBtn').onclick = () => { if (!busy) editor.close(); };
  q('addContactBtn').onclick = () => openEditor();
  q('refreshContactsBtn').onclick = refresh;
  q('contactSearch').oninput = renderContacts;
  function updateDepartmentField() {
    const visible = categoryKey(field('category').value) === categoryKey('우리회사');
    q('contactDepartmentField').hidden = !visible;
    field('department').disabled = !visible;
  }
  field('category').addEventListener('input', updateDepartmentField);
  q('contactList').onclick = event => { const button = event.target.closest('[data-edit]'); if (button) openEditor(contacts.find(c => String(c.id) === button.dataset.edit)); };
  q('contactFilters').onclick = event => {
    const button = event.target.closest('[data-category]'); if (!button) return;
    category = button.dataset.category;
    for (const b of q('contactFilters').querySelectorAll('button')) { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); }
    renderContacts();
  };
  q('departmentFilters').onclick = event => {
    const button = event.target.closest('[data-department]');
    if (!button || !['전체', ...departments.names].includes(button.dataset.department)) return;
    selectedDepartment = button.dataset.department;
    renderContacts();
  };
  function switchView(showContacts) {
    q('sitesView').hidden = showContacts; q('contactsView').hidden = !showContacts;
    for (const [id, selected] of [['showSitesBtn',!showContacts],['showContactsBtn',showContacts]]) { q(id).classList.toggle('selected',selected); q(id).setAttribute('aria-pressed',String(selected)); }
    if (showContacts) { renderContacts(); refresh(); }
  }
  q('showSitesBtn').onclick = () => switchView(false);
  q('showContactsBtn').onclick = () => switchView(true);
  if (preview) {
    const notice = document.createElement('p');
    notice.className = 'department-preview-notice';
    notice.textContent = '업무수첩 미리보기 · 전달하신 부서 배정을 반영했습니다. 읽기 전용입니다.';
    q('contactsView').prepend(notice);
    category = '우리회사';
    q('addContactBtn').disabled = true;
    switchView(true);
  }
})();
