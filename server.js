/* ============================================================================
   BWS Contractor Induction — backend (groundwork for Railway)
   ----------------------------------------------------------------------------
   A tiny Express app that serves the existing static pages AND provides a
   shared data store so submissions / contacts / questions / site maps are the
   SAME for everyone (cross-device) instead of per-browser localStorage.

   The client (store.js) auto-detects which mode it's in:
     • Served by THIS server  -> /config.js returns CI_API_BASE='/api' -> uses the API
     • GitHub Pages / file://  -> committed config.js has CI_API_BASE='' -> uses localStorage

   So this file changes NOTHING about the current static deployment. It only
   "turns on" when you actually run/deploy it (e.g. `railway up`).

   Persistence: a single JSON file at DATA_FILE (put it on a Railway Volume so
   it survives redeploys, e.g. Volume mounted at /data, DATA_FILE=/data/store.json).

   Env vars:
     PORT        - port to listen on (Railway sets this automatically)
     DATA_FILE   - path to the JSON store (default ./data/store.json)
     ADMIN_CODE  - if set, admin actions (read submissions, edit config/maps)
                   require header  x-admin-code: <ADMIN_CODE>. Leave unset for
                   local testing; SET IT before real use.
   ============================================================================ */
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'store.json');
const ADMIN_CODE = process.env.ADMIN_CODE || '';   // '' = open (dev only)

const app = express();
app.use(express.json({ limit: '30mb' }));           // submissions/maps can carry base64

/* ----------------------------- data store -------------------------------- */
// Shape: { submissions: [...], config: { sites:[], contacts:{key:[]}, checklist:[]|null }, maps: { key:{tmp,assembly} } }
function emptyStore(){ return { submissions: [], config: { sites: [], contacts: {}, checklist: null }, maps: {} }; }
function readStore(){
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch(e){ return emptyStore(); }
}
function writeStore(s){
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(s, null, 2));
}
// hydrate once on boot so the file exists
if (!fs.existsSync(DATA_FILE)) writeStore(emptyStore());

/* ----------------------------- admin gate -------------------------------- */
function requireAdmin(req, res, next){
  if (!ADMIN_CODE) return next();                    // open in dev
  if ((req.get('x-admin-code') || '') === ADMIN_CODE) return next();
  res.status(401).json({ error: 'admin code required' });
}

/* --------------- config.js override (turns the client to API mode) -------- */
// Must be registered BEFORE express.static so it wins over the committed file.
app.get('/config.js', (req, res) => {
  res.type('application/javascript').send("window.CI_API_BASE='/api';\n");
});

/* ------------------------------- API ------------------------------------- */
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Public config the form needs (no submissions/PII here).
app.get('/api/config', (req, res) => {
  const s = readStore();
  res.json(s.config || { sites: [], contacts: {}, checklist: null });
});
// Replace config (admin).
app.put('/api/config', requireAdmin, (req, res) => {
  const s = readStore();
  const c = req.body || {};
  s.config = {
    sites: Array.isArray(c.sites) ? c.sites : [],
    contacts: (c.contacts && typeof c.contacts === 'object') ? c.contacts : {},
    checklist: Array.isArray(c.checklist) ? c.checklist : null
  };
  writeStore(s);
  res.json(s.config);
});

// Site maps — stored as data URLs; served back as data URLs so the client logic
// (which already understands data:image / data:application/pdf) is unchanged.
app.get('/api/maps/:key/:kind', (req, res) => {
  const s = readStore();
  const m = (s.maps || {})[req.params.key] || {};
  const d = m[req.params.kind];
  if (!d) return res.status(404).json({ error: 'no map' });
  res.json({ dataUrl: d });
});
app.put('/api/maps/:key/:kind', requireAdmin, (req, res) => {
  const s = readStore();
  s.maps = s.maps || {};
  s.maps[req.params.key] = s.maps[req.params.key] || {};
  s.maps[req.params.key][req.params.kind] = (req.body && req.body.dataUrl) || '';
  writeStore(s);
  res.json({ ok: true });
});
app.delete('/api/maps/:key/:kind', requireAdmin, (req, res) => {
  const s = readStore();
  if (s.maps && s.maps[req.params.key]) { delete s.maps[req.params.key][req.params.kind]; writeStore(s); }
  res.json({ ok: true });
});

// Submissions — POST is public (contractors have no login); GET is admin (PII).
app.post('/api/submissions', (req, res) => {
  const s = readStore();
  const p = req.body || {};
  p._receivedAt = new Date().toISOString();
  s.submissions.unshift(p);
  writeStore(s);
  res.json({ ok: true, count: s.submissions.length });
});
app.get('/api/submissions', requireAdmin, (req, res) => {
  res.json(readStore().submissions || []);
});
app.delete('/api/submissions', requireAdmin, (req, res) => {
  const s = readStore(); s.submissions = []; writeStore(s);
  res.json({ ok: true });
});

/* --------------------------- static site --------------------------------- */
app.use(express.static(__dirname));                  // serves index.html, admin.html, data/, images/, etc.

app.listen(PORT, () => {
  console.log(`Induction server on :${PORT}  (data: ${DATA_FILE}, admin: ${ADMIN_CODE ? 'protected' : 'OPEN — set ADMIN_CODE'})`);
});
