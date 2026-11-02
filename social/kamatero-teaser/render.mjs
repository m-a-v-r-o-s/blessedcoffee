// Blessed Kamatero first three IG posts: one 3240x1350 panorama sliced into three 1080x1350 tiles.
// Photos avoid anything showing the Patisia shop. Run: node social/kamatero-teaser/render.mjs
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'social/kamatero-teaser');
const CHROME = process.env.CHROME_PATH || '/home/akos/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const b64 = (p, t) => `data:${t};base64,${readFileSync(p).toString('base64')}`;
const shoot = (n) => b64(`${ROOT}/social/photos/shoot/${n}.jpg`, 'image/jpeg');
const logo = b64(`${ROOT}/public/blessed-logo.webp`, 'image/webp');
const GW = 1012.5, OX = 101.25, PAD = 33.75; // grid shows 3:4 centre crops of the 4:5 tiles: slice with overlap so the grid is seamless
const tiles = ['beans-macro', 'drip-close', 'milk-steam'];

const html = (i) => `<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Barlow+Semi+Condensed:wght@500;600&display=swap');
*{margin:0;box-sizing:border-box}
body{width:3240px;height:1350px;background:#0A0A0A;position:relative;overflow:hidden;color:#FAF6F0}
.t{position:absolute;top:0;width:1080px;height:1350px}
.t img{width:100%;height:100%;object-fit:cover}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,8,.45),rgba(8,8,8,.62) 50%,rgba(8,8,8,.8))}
h1{position:absolute;left:0;right:0;top:48%;transform:translateY(-50%);text-align:center;font:600 128px/1 'Playfair Display',serif;letter-spacing:-.015em;white-space:nowrap}
h1 em{font-style:italic;font-weight:400;color:#C9972A}
.mark{position:absolute;left:${OX + 60}px;top:84px;width:150px;filter:invert(1);opacity:.94}
.foot{position:absolute;right:76px;bottom:64px;font:600 25px 'Barlow Semi Condensed',sans-serif;letter-spacing:.2em;color:#CFC6BC}
.soon{position:absolute;left:0;right:0;top:calc(50% + 110px);text-align:center;font:600 30px 'Barlow Semi Condensed',sans-serif;letter-spacing:.34em;color:#C9972A}
</style>
<div class="t" style="left:${OX + i * GW - PAD}px;width:1080px"><img src="${shoot(tiles[i])}"></div>
<div class="shade" style="position:absolute;left:0;top:0;width:3240px;height:1350px"></div>
<img class="mark" src="${logo}">
<h1>Σας περιμένουμε σύντομα <em>στο νέο μας</em> Blessed</h1>
<div class="soon">ΑΝΟΙΓΟΥΜΕ ΣΥΝΤΟΜΑ</div>
<div class="foot" style="left:2150px;right:auto;width:928px;text-align:right">ΚΑΜΑΤΕΡΟ · ΚΩΣΤΗ ΠΑΛΑΜΑ 17Α</div>`;

const br = await chromium.launch({ executablePath: CHROME });
const pg = await br.newPage({ viewport: { width: 3240, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < 3; i++) {
  await pg.setContent(html(i), { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: `${OUT}/kamatero-${i + 1}.jpg`, type: 'jpeg', quality: 92, clip: { x: OX + i * GW - PAD, y: 0, width: 1080, height: 1350 } });
}
await br.close();

// Single 1080x1920 story. Logo centred at the top, text inside IG's safe zone (top/bottom ~250px).
const sb = await chromium.launch({ executablePath: CHROME });
const sp = await sb.newPage({ viewport: { width: 1080, height: 1920 } });
await sp.setContent(`<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Barlow+Semi+Condensed:wght@600&display=swap');
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;position:relative;overflow:hidden;background:#0A0A0A;color:#FAF6F0;text-align:center}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,8,.55),rgba(8,8,8,.5) 40%,rgba(8,8,8,.82))}
.mark{position:absolute;left:465px;top:250px;width:150px;filter:invert(1);opacity:.94}
h1{position:absolute;left:0;right:0;top:48%;transform:translateY(-50%);font:600 118px/1.1 'Playfair Display',serif;letter-spacing:-.015em}
h1 em{display:block;font-style:italic;font-weight:400;color:#C9972A}
.soon{position:absolute;left:0;right:0;top:calc(50% + 330px);font:600 32px 'Barlow Semi Condensed',sans-serif;letter-spacing:.34em;color:#C9972A}
.foot{position:absolute;left:0;right:0;bottom:250px;font:600 27px 'Barlow Semi Condensed',sans-serif;letter-spacing:.2em;color:#CFC6BC}
</style>
<img class="bg" src="${shoot('drip-close')}"><div class="shade"></div><img class="mark" src="${logo}">
<h1>Σας περιμένουμε<br>σύντομα<em>στο νέο μας</em>Blessed</h1>
<div class="soon">ΑΝΟΙΓΟΥΜΕ ΣΥΝΤΟΜΑ</div>
<div class="foot">ΚΑΜΑΤΕΡΟ · ΚΩΣΤΗ ΠΑΛΑΜΑ 17Α</div>`, { waitUntil: 'networkidle' });
await sp.evaluate(() => document.fonts.ready);
await sp.screenshot({ path: `${OUT}/kamatero-story.jpg`, type: 'jpeg', quality: 92 });
await sb.close();
