'use strict';
globalThis.ContactDepartments = Object.freeze({
  names: Object.freeze(['경영지원', '전장사업부', '기계사업부', '프로그램사업부', '연구소']),
  isCompany(contact) {
    return String(contact.category || '').normalize('NFKC').replace(/\s+/g, '') === '우리회사';
  },
  get(contact) {
    if (!this.isCompany(contact)) return '';
    const value = String(contact.department || '').trim();
    return this.names.includes(value) ? value : '';
  },
  matches(contact, selection) {
    return selection === '전체' || this.get(contact) === selection;
  }
});
