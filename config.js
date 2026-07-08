/* Client config. On GitHub Pages / file:// this committed file is used as-is:
   CI_API_BASE = '' means the pages use on-device localStorage (current behaviour).
   When served by server.js (Railway), that server returns its OWN /config.js with
   CI_API_BASE='/api', so the same pages talk to the shared backend automatically.
   Do not hard-code a URL here — leave it blank. */
window.CI_API_BASE = '';
