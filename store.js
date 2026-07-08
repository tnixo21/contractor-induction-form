/* ============================================================================
   CIStore — one data layer for both pages.
   • If window.CI_API_BASE is set (served by server.js) -> talk to the shared API.
   • Otherwise -> use this device's localStorage (unchanged legacy behaviour).
   All methods are async so callers don't care which mode is active.
   ============================================================================ */
(function () {
  const BASE = (window.CI_API_BASE || '').replace(/\/$/, '');
  const SERVER = !!BASE;
  const LS = window.localStorage;

  function lsGet(k, d) { try { const v = LS.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { LS.setItem(k, JSON.stringify(v)); }

  // admin code (only needed in server mode when ADMIN_CODE is set on the server)
  function adminHeaders() {
    const c = sessionStorage.getItem('ci-admin') || '';
    return c ? { 'x-admin-code': c } : {};
  }
  async function api(path, opts, retry) {
    opts = opts || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, adminHeaders(), opts.headers || {});
    const r = await fetch(BASE + path, opts);
    if (r.status === 401 && !retry) {
      const code = window.prompt('Admin code required:');
      if (code) { sessionStorage.setItem('ci-admin', code); return api(path, opts, true); }
    }
    if (!r.ok) throw new Error('API ' + r.status + ' ' + path);
    const ct = r.headers.get('content-type') || '';
    return ct.includes('json') ? r.json() : r.text();
  }

  // cached config (sites/contacts/checklist) in server mode
  let _cfg = null;
  async function cfg() { if (!_cfg) _cfg = await api('/config'); return _cfg; }
  function persistConfig() { return api('/config', { method: 'PUT', body: JSON.stringify(_cfg) }); }

  // In local mode, assemble a config bundle from localStorage keys (for the dashboard).
  function localBundle() {
    const contacts = {};
    for (let i = 0; i < LS.length; i++) {
      const k = LS.key(i);
      if (k && k.indexOf('ci-contacts-') === 0) contacts[k.slice('ci-contacts-'.length)] = lsGet(k, []);
    }
    return { sites: lsGet('ci-sites', []), contacts, checklist: lsGet('ci-checklist', null) };
  }

  const Store = {
    mode: SERVER ? 'server' : 'local',

    // Load config bundle. Returns {sites, contacts, checklist}. Call once before reads.
    async getConfigBundle() { return SERVER ? await cfg() : localBundle(); },

    // ---- sites (custom sites added in the dashboard) ----
    async getSites() { return SERVER ? (await cfg()).sites || [] : lsGet('ci-sites', []); },
    async setSites(a) { if (SERVER) { (await cfg()).sites = a; return persistConfig(); } lsSet('ci-sites', a); },

    // ---- contacts (per site) ----
    async getContacts(key) { return SERVER ? ((await cfg()).contacts || {})[key] || [] : lsGet('ci-contacts-' + key, []); },
    async setContacts(key, a) {
      if (SERVER) { const c = await cfg(); c.contacts = c.contacts || {}; c.contacts[key] = a; return persistConfig(); }
      lsSet('ci-contacts-' + key, a);
    },

    // ---- checklist override (null = defaults) ----
    async getChecklist() { return SERVER ? (await cfg()).checklist || null : lsGet('ci-checklist', null); },
    async setChecklist(arr) {
      if (SERVER) { (await cfg()).checklist = arr || null; return persistConfig(); }
      if (arr == null) LS.removeItem('ci-checklist'); else lsSet('ci-checklist', arr);
    },

    // ---- site maps (kind = 'tmp' | 'assembly'), stored/returned as data URLs ----
    async getMap(kind, key) {
      if (SERVER) {
        try { const r = await api('/maps/' + encodeURIComponent(key) + '/' + kind); return r && r.dataUrl || null; }
        catch (e) { return null; }
      }
      return LS.getItem((kind === 'tmp' ? 'ci-tmp-' : 'ci-asm-') + key);
    },
    async setMap(kind, key, dataUrl) {
      if (SERVER) return api('/maps/' + encodeURIComponent(key) + '/' + kind, { method: 'PUT', body: JSON.stringify({ dataUrl }) });
      try { LS.setItem((kind === 'tmp' ? 'ci-tmp-' : 'ci-asm-') + key, dataUrl); return true; }
      catch (e) { return false; }
    },
    async removeMap(kind, key) {
      if (SERVER) return api('/maps/' + encodeURIComponent(key) + '/' + kind, { method: 'DELETE' });
      LS.removeItem((kind === 'tmp' ? 'ci-tmp-' : 'ci-asm-') + key);
    },

    // ---- submissions ----
    async getSubmissions() { return SERVER ? await api('/submissions') : lsGet('ci-submissions', []); },
    async addSubmission(payload) {
      if (SERVER) { await api('/submissions', { method: 'POST', body: JSON.stringify(payload) }); return true; }
      // local: quota-guarded, drops attachment data if oversized
      const KEY = 'ci-submissions';
      let list = lsGet(KEY, []); list.unshift(payload);
      try { lsSet(KEY, list); return true; }
      catch (e) {
        list[0] = Object.assign({}, payload, { documents: (payload.documents || []).map(d => ({ docType: d.docType, name: d.name, type: d.type, size: d.size })) });
        try { lsSet(KEY, list); return 'lite'; } catch (e2) { return false; }
      }
    }
  };

  window.CIStore = Store;
})();
