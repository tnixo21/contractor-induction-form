# Going live on Railway (shared, cross-device store)

Right now the site runs as static pages (GitHub Pages) and stores everything in the
browser's **localStorage** — data only exists on the device that typed it. This backend
turns it into a **shared** store so submissions, contacts, questions and site maps are the
same for everyone.

**Nothing here affects the current static site.** The client (`store.js`) only switches to
the server when it's actually served by `server.js` (which returns `/config.js` =
`CI_API_BASE='/api'`). On GitHub Pages the committed `config.js` keeps `CI_API_BASE=''`, so
it still uses localStorage.

## What the backend provides
- `POST /api/submissions` (public) — form saves each induction here
- `GET  /api/submissions` (admin) — dashboard reads them
- `GET/PUT /api/config` — sites, per-site contacts, question overrides
- `GET/PUT/DELETE /api/maps/:key/:kind` — TMP / assembly maps (`kind` = `tmp` | `assembly`)
- serves `index.html`, `admin.html`, etc.

## Deploy steps (do this when the team is ready)
1. **Remove sample data first** (planned separate step) so the dashboard starts clean.
2. From this folder, with the Railway CLI logged in:
   ```powershell
   railway init            # or: railway link  (to an existing project)
   railway up              # builds & deploys (uses package.json start script)
   ```
3. **Add a Volume** in the Railway project (Settings → Volumes), mount it at `/data`.
4. **Set Variables** in Railway:
   - `DATA_FILE=/data/store.json`   (persist across redeploys)
   - `ADMIN_CODE=<a strong secret>` (gates reading submissions + editing config/maps)
5. Open the Railway URL — the form + dashboard now use the shared store automatically.
6. Point the QR codes / links at the Railway URL (or add a custom domain).

## Local test
```powershell
npm install
npm start           # http://localhost:3000  (ADMIN_CODE unset = open, dev only)
```
Open `http://localhost:3000/` (form) and `http://localhost:3000/admin.html` (dashboard).

## Notes / next steps
- The dashboard will prompt for the admin code once (stored in sessionStorage) when
  `ADMIN_CODE` is set on the server.
- Attachments & maps are stored as base64 inside the JSON store — fine to start; if volume
  size grows, move them to file storage or a Railway Volume path + static serving.
- Cross-device only works because everyone hits the same server URL — so publish/share the
  Railway URL, not the GitHub Pages URL, once you cut over.
