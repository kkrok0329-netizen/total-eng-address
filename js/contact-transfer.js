'use strict';
(() => {
  const clean = value => String(value || '').replace(/\r\n|\r/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  const escape = value => clean(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  function details(contact) {
    return [contact.company || contact.category, globalThis.ContactDepartments?.get(contact), contact.siteName].map(clean).filter(Boolean);
  }
  function text(contact) {
    return [clean([contact.name, contact.position].filter(Boolean).join(' ')), clean(contact.phone), ...new Set(details(contact))].filter(Boolean).join('\n');
  }
  function fold(line) {
    let result = '', current = '', size = 0;
    const encoder = new TextEncoder();
    for (const char of line) {
      const bytes = encoder.encode(char).length;
      if (size + bytes > 75) { result += current + '\r\n'; current = ' '; size = 1; }
      current += char; size += bytes;
    }
    return result + current;
  }
  function vcard(contact) {
    const phone = clean(contact.phone).replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    const department = globalThis.ContactDepartments?.get(contact) || '';
    const organization = contact.company || (contact.category === '우리회사' ? 'TOTAL ENG' : contact.category) || '';
    const lines = ['BEGIN:VCARD','VERSION:3.0',`FN:${escape([contact.name, contact.position].filter(Boolean).join(' '))}`,`N:${escape(contact.name)};;;;`];
    if (phone) lines.push(`TEL;TYPE=VOICE:${phone}`);
    if (organization || department) lines.push(`ORG:${escape(organization)};${escape(department)}`);
    if (contact.position) lines.push(`TITLE:${escape(contact.position)}`);
    if (contact.siteName) lines.push(`NOTE:${escape('현장: ' + clean(contact.siteName))}`);
    lines.push('END:VCARD');
    return lines.map(fold).join('\r\n') + '\r\n';
  }
  function filename(contact) {
    return (clean(contact.name).replace(/[\\/:*?"<>|\r\n]/g, '_').slice(0, 60) || '연락처') + '.vcf';
  }
  async function share(contact) {
    const value = text(contact);
    if (navigator.share) {
      try { await navigator.share({title: clean(contact.name) + ' 연락처', text: value}); return 'shared'; }
      catch (error) { if (error.name === 'AbortError') return 'cancelled'; }
    }
    try { await navigator.clipboard.writeText(value); return 'copied'; }
    catch (_) { return {manual: value}; }
  }
  function save(contact) {
    const blob = new Blob([vcard(contact)], {type: 'text/vcard;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename(contact);
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  globalThis.ContactTransfer = {text, vcard, filename, share, save};
})();
