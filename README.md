# BWS Contractor Induction

Static site — deploys as-is to **GitHub Pages** or **Railway** (no build step).

## Pages (two separate QR codes)
| File | Who scans it | Purpose |
|---|---|---|
| `index.html` | Contractors + BWS employee | The induction form. Per-site QR codes point here (optionally `?site=portbrisbane` once pre-fill is added). |
| `admin.html` | BWS HSSEQ / managers only | Results dashboard. Its own QR / bookmark — keep the link private. |

## Folder structure
```
contractor-induction-form/
├── index.html                  # the form
├── admin.html                  # the admin dashboard
├── data/
│   └── sample-inductions.js    # demo data (dashboard falls back to this)
├── images/                     # per-site maps (add PNGs here)
│   ├── tmp-<sitekey>.png        # Traffic Management Plan
│   └── assembly-<sitekey>.png   # Emergency Assembly point
└── README.md
```
Site keys: `thomastown, campbellfield, essendon, portbrisbane, hamilton, jandakot, sydney, lae`.
Drop a correctly-named PNG into `images/` and it appears automatically — until then a labelled placeholder shows.

## Wiring up live data (SharePoint)
Both pages are static, so a small **Power Automate** flow does the server work — no Azure app registration needed.

1. **Submit flow** — *When an HTTP request is received* → parse the JSON the form POSTs → *Create item* in the SharePoint list (site `EnergyProjectsAUWarehousingTransport`) → *Create file* in the document library for each uploaded photo → *Send an email / Teams message* to HSSEQ.
   Copy the generated URL into `WEBHOOK_URL` at the top of `index.html`.
2. **Read flow** — *When an HTTP request is received* → *Get items* from the list → *Respond* with the JSON array.
   Copy that URL into `DATA_URL` at the top of `admin.html`.

Until `WEBHOOK_URL` is set, the form runs in test mode (downloads each submission as JSON).
Until `DATA_URL` is set, the dashboard shows the sample inductions in `data/`.

## Deploy
- **GitHub Pages:** push this folder to a repo → Settings → Pages → deploy from branch. Form = `…/index.html`, admin = `…/admin.html`.
- **Railway:** serve the folder with any static server (e.g. add a `Caddyfile`/`serve`), or use the existing static-site pattern from the other dashboards.
