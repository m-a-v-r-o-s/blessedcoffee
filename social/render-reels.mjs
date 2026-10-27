// Renders Blessed Coffee Reels (1080x1920 MP4, 30fps) built around the 3D cup.
//   node social/render-reels.mjs                    all reels
//   node social/render-reels.mjs reel-panels        only these ids
//   node social/render-reels.mjs --peek [ids]       contact sheet of 6 frames per reel, no video
//
// Each reel is one page: brand ground, a type layer behind the cup, the cup scene itself
// (social/cup/cup.html in an iframe, driven through its window.pose), and a type layer in
// front. frame(s, $) poses everything for time s (seconds); every frame is a screenshot, then
// ffmpeg. Same BRAND tokens and no-invented-facts rule as render.mjs: every price, time and
// name below is in src/App.jsx. Output is silent: add trending audio in the IG app.

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './cup/serve.mjs';
import { PANEL, LID, LABEL } from './cup/shots.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = `${ROOT}/social/library-reels`;
const TMP = `${ROOT}/social/.render-reels-tmp`;
const PORT = 3012; // never 3000
const FPS = 30;
const W = 1080, H = 1920;
const CONCURRENCY = Number(process.env.REEL_JOBS || 4); // swiftshader is CPU-bound: one reel per few cores
const CHROME = process.env.CHROME_PATH || '/home/akos/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';

const BRAND = { address: 'ΡΟΔΟΥ 68 · ΚΑΤΩ ΠΑΤΗΣΙΑ', site: 'BLESSED.CAFE', ink: '#FAF6F0', gold: '#C9972A', ground: '#0A0A0A', muted: '#8A7060' };
const TAGS = '#blessedcoffee #katopatisia #athenscoffee #specialtycoffee #coffeeathens #πατησια #καφεσ #athens';

const b64 = (p) => readFileSync(p).toString('base64');
const logo = `data:image/webp;base64,${b64(`${ROOT}/public/blessed-logo.webp`)}`;
const asset = (f) => `data:image/${f.endsWith('.png') ? 'png' : 'webp'};base64,${b64(`${ROOT}/public/${f}`)}`;
const stamp = `data:image/png;base64,${b64(`${ROOT}/social/cup/cup-watermark-white.png`)}`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Barlow+Semi+Condensed:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${BRAND.ground}; color: ${BRAND.ink};
    font-family: 'Barlow Semi Condensed', sans-serif; -webkit-font-smoothing: antialiased; }
  #ground { position: absolute; inset: 0; background: linear-gradient(180deg, #1B1611 0%, #110E0B 50%, #070707 100%); overflow: hidden; }
  /* Cup reels: a shoot photo as the room around the cup, blurred and darkened, dark at the bottom for type. */
  #ground img { position: absolute; left: -40px; top: -40px; width: calc(100% + 80px); height: calc(100% + 80px); object-fit: cover;
    filter: blur(14px) brightness(.48) saturate(.95); }
  #ground i { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,8,8,.4) 0%, rgba(8,8,8,.08) 25%, rgba(8,8,8,.15) 50%, rgba(6,6,6,.85) 72%, rgba(6,6,6,.96) 100%); }
  #cup { position: absolute; inset: 0; width: ${W}px; height: ${H}px; border: 0; background: transparent; }
  .layer { position: absolute; inset: 0; }
  #back { z-index: 1; } #cup { z-index: 2; } #front { z-index: 3; }
  /* Type block: bottom-anchored inside the Reels safe zone (clear of the top 250px and bottom 340px). */
  .txt { position: absolute; left: 84px; right: 84px; bottom: 360px; text-align: center; }
  .kicker { font-size: 30px; font-weight: 600; letter-spacing: .34em; text-transform: uppercase; color: ${BRAND.gold}; }
  h1 { font-family: 'Playfair Display', serif; font-weight: 600; font-size: 104px; line-height: 1.02; letter-spacing: -.015em; margin-top: 26px; }
  h1 em { font-style: italic; color: ${BRAND.gold}; }
  .lede { font-size: 40px; font-weight: 300; line-height: 1.4; color: #CFC6BC; margin-top: 24px; }
  .rule { width: 132px; height: 3px; background: ${BRAND.gold}; margin: 30px auto 0; }
  .mark { position: absolute; top: 270px; left: 50%; width: 120px; margin-left: -60px; filter: invert(1); opacity: .9; }
  .foot { position: absolute; left: 84px; right: 84px; bottom: 250px; display: flex; justify-content: space-between;
    padding-top: 22px; border-top: 1px solid #2A2422; font-size: 24px; font-weight: 500; letter-spacing: .2em; color: #6E645C; }
  .fade { opacity: 0; }
  /* Photo reels: photographer shots crossfading under a slow push-in, dark where the type sits. */
  .sh { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; }
  .sh.whole { object-fit: contain; object-position: 50% 36%; } /* signage: whole shot on the ground, never cropped */
  .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,8,8,.5) 0%, rgba(8,8,8,0) 18%,
    rgba(8,8,8,0) 45%, rgba(6,6,6,.75) 64%, rgba(6,6,6,.95) 84%); }
  .stack { position: relative; height: 215px; margin-top: 26px; } /* room for a two-line headline */
  .stack h1 { position: absolute; left: 0; right: 0; bottom: 0; margin: 0; }
`;
const foot = `<div class="foot"><span>${BRAND.address}</span><span>${BRAND.site}</span></div>`;

// Photo reels (no cup): [img, from s, to s, zoom from, zoom to, pan px, whole] per shot; each fades in over
// the one before. whole: show the entire shot (landscape signage) instead of filling the frame.
const shots = (list) => list.map(([img, a, b, z0 = 1.03, z1 = 1.14, px = 0, whole = false]) =>
  `<img class="sh${whole ? ' whole' : ''}" src="/social/photos/shoot/${img}.jpg" data-a="${a}" data-b="${b}" data-z0="${z0}" data-z1="${z1}" data-px="${px}">`).join('') +
  '<div class="shade"></div>';
// A fixed kicker, headlines that swap in one spot ([html, from, to]), and an optional closing lede [html, from].
const lines = (kicker, list, lede) => `<img class="mark" src="${logo}"><div class="txt"><div class="kicker">${kicker}</div>
  <div class="stack">${list.map(([h, a, b], i) => `<h1 class="t fade" id="t${i}" data-a="${a}" data-b="${b}">${h}</h1>`).join('')}</div>
  ${lede ? `<div class="lede t fade" id="tl" data-a="${lede[1]}" data-b="99">${lede[0]}</div>` : ''}</div>${foot}`;

// ─── REELS ───────────────────────────────────────────────────────────────────
// frame(s, $) runs inside the page. $: pose(o) (the cup scene), q(sel), seg(s,a,b) -> 0..1,
// lerp, io/out/back/bounce easings, show(sel, v, dy) for fade+rise. Cup poses reuse the
// LID/LABEL light rigs and the PANEL centres measured in cup/shots.mjs.
const REELS = [
  {
    id: 'reel-reveal',
    bg: 'interior',
    seconds: 8,
    front: `<div class="txt">
      <div class="kicker fade" id="k">Est. 2024 · Κατω Πατησια</div>
      <h1 class="fade" id="h">A taste of<br><em>heaven</em><br>in every cup.</h1>
    </div>${foot}`,
    frame: (s, $) => {
      const a = $.io($.seg(s, 0, 4.2));
      $.pose({ ...$.LID, rot: $.lerp(-0.16, 0, $.out($.seg(s, 0, 5))), cam: [0, $.lerp(60, 150, a), $.lerp(1080, 830, a)], look: [0, 36, 0], fov: 26,
        keyI: 13000 * $.io($.seg(s, 0.2, 3)), keyPos: [$.lerp(320, -220, a), 420, 220], rimI: 3.5 * $.seg(s, 1.5, 3.5), env: 0.15 * $.seg(s, 1, 4), steam: s });
      $.show('#k', $.seg(s, 3.6, 4.4)); $.show('#h', $.out($.seg(s, 4.2, 5.4)), 40);
    },
    caption: {
      el: 'Γεύση απ\' τον παράδεισο, σε κάθε ποτήρι. Ρόδου 68, Κάτω Πατήσια, κάθε μέρα 07:00 – 22:00.',
      en: 'A taste of heaven in every cup. Rodou 68, Kato Patisia, every day 07:00 – 22:00.',
    },
  },
  {
    id: 'reel-panels',
    bg: 'slat-wall',
    seconds: 12, // seamless: 3 x 4s, hold 2.4s on each panel, 1.6s turn to the next
    front: `<div class="txt">
      <div id="p0" class="fade"><div class="kicker">01 / 03 · Το σημα</div><h1>Coffee<br><em>&amp; spirits.</em></h1></div>
      <div id="p1" class="fade" style="position:absolute;left:0;right:0;bottom:0"><div class="kicker">02 / 03 · Το συνθημα</div><h1>Γεύση απ' τον<br><em>παράδεισο.</em></h1></div>
      <div id="p2" class="fade" style="position:absolute;left:0;right:0;bottom:0"><div class="kicker">03 / 03 · Ο καφες</div><h1>Mrs Rose<br><em>Caffè.</em></h1></div>
    </div>${foot}`,
    frame: (s, $) => {
      const stops = [$.PANEL.logo, $.PANEL.slogan, $.PANEL.partner, 1];
      const i = Math.floor(s / 4) % 3, u = s % 4;
      const rot = $.lerp(stops[i], stops[i + 1], $.io($.seg(u, 2.4, 4)));
      $.pose({ ...$.LABEL, rot, cam: [0, 130, 750], look: [0, 40, 0], fov: 26, keyPos: [-260, 360, 420] });
      for (let k = 0; k < 3; k++) {
        const d = ((s - 4 * k + 12 + 0.5) % 12) - 0.5; // seconds since panel k's hold began, wrapped
        $.show(`#p${k}`, Math.min($.seg(d, -0.6, 0), 1 - $.seg(d, 2.3, 2.7)), 24);
      }
    },
    caption: {
      el: 'Γύρνα το ποτήρι. Το σήμα μας, το σύνθημά μας, ο καφές μας: Mrs Rose Caffè. Ρόδου 68, κάθε μέρα 07:00 – 22:00.',
      en: 'Turn the cup. Our mark, our motto, our coffee: Mrs Rose Caffè. Rodou 68, every day 07:00 – 22:00.',
    },
  },
  {
    id: 'reel-flyover',
    bg: 'beans-pile',
    seconds: 8,
    front: `<div class="txt">
      <div class="kicker fade" id="k">Βρες μας</div>
      <h1 class="fade" id="h">Ρόδου 68,<br><em>Κάτω Πατήσια.</em></h1>
      <div class="lede fade" id="l">Κάθε μέρα, 07:00 – 22:00.</div>
    </div>${foot}`,
    frame: (s, $) => {
      const a = $.io($.seg(s, 0.8, 5.2));
      const phi = $.lerp(89.9, 6, a) * Math.PI / 180, r = $.lerp(620, 770, a);
      const ly = $.lerp(95, 36, a);
      $.pose({ ...$.LID, rot: $.lerp(-0.12, 0, a), cam: [0, ly + r * Math.sin(phi), r * Math.cos(phi)], look: [0, ly, 0], fov: 26,
        keyPos: [-220, 420, 240], keyAngle: $.lerp(0.35, 0.55, a), steam: s });
      $.show('#k', $.seg(s, 4.8, 5.4)); $.show('#h', $.out($.seg(s, 5.1, 6)), 40); $.show('#l', $.seg(s, 5.8, 6.5), 20);
    },
    caption: {
      el: 'Από πάνω μέχρι το σήμα. Ρόδου 68, Κάτω Πατήσια, κάθε μέρα 07:00 – 22:00.',
      en: 'From the lid down to the logo. Rodou 68, Kato Patisia, every day 07:00 – 22:00.',
    },
  },
  {
    id: 'reel-drop',
    bg: 'crema-double-2',
    seconds: 6,
    front: `<div class="txt">
      <div class="kicker fade" id="k">Espresso · 1.80€</div>
      <h1 class="fade" id="h">Ο καφές σου.<br><em>Έτοιμος.</em></h1>
    </div>${foot}`,
    frame: (s, $) => {
      const d = $.seg(s, 0.2, 1.6);
      const lift = 900 * (1 - $.bounce(d));
      const wob = Math.exp(-4 * Math.max(0, s - 1.1)) * Math.sin(Math.max(0, s - 1.1) * 14) * 0.06;
      $.pose({ ...$.LID, rot: 0.02, lift, tilt: wob, cam: [0, 150, 830], look: [0, 36, 0], fov: 26, keyPos: [-220, 440, 260],
        shadow: 1 - 0.8 * Math.min(1, lift / 900), steam: s > 1.6 ? s : undefined });
      $.show('#h', $.out($.seg(s, 2, 2.9)), 40); $.show('#k', $.seg(s, 2.8, 3.4));
    },
    caption: {
      el: 'Ο καφές σου, έτοιμος. Espresso 1.80€, κάθε μέρα από τις 07:00. Ρόδου 68.',
      en: 'Your coffee, ready. Espresso €1.80, every day from 7am. Rodou 68.',
    },
  },
  {
    id: 'reel-slogan',
    bg: 'interior-wide',
    seconds: 10, // seamless: the type ring makes exactly one turn
    back: `<div id="rb"></div>`,
    front: `<div id="rf"></div><div class="txt">
      <h1 style="font-size:84px">Γεύση απ' τον<br><em>παράδεισο,</em><br>σε κάθε ποτήρι.</h1>
    </div>${foot}`,
    frame: (s, $) => {
      const t = s / 10;
      $.pose({ ...$.LABEL, rot: 0.025 * Math.sin(t * Math.PI * 2), cam: [0, 150, 830], look: [0, 36, 0], fov: 26, keyPos: [-260, 360, 420] });
      const RING_Y = 820;
      const txt = 'A TASTE OF HEAVEN IN EVERY CUP · A TASTE OF HEAVEN IN EVERY CUP · ';
      const rb = $.q('#rb'), rf = $.q('#rf');
      const letters = window.letters ||= [...txt].map((ch) => {
        const e = document.createElement('span'); e.textContent = ch;
        e.style.cssText = `position:absolute;font:700 54px 'Barlow Semi Condensed';width:60px;margin-left:-30px;text-align:center;`;
        rb.appendChild(e);
        return e;
      });
      letters.forEach((e, i) => {
        const th = (i / txt.length + t) * Math.PI * 2, z = Math.cos(th);
        e.style.left = `${540 + 430 * Math.sin(th)}px`; e.style.top = `${RING_Y + 90 * z}px`;
        e.style.transform = `scaleX(${Math.max(0.05, Math.abs(z) ** 0.5)}) scale(${0.82 + 0.18 * z})`;
        // letters thin out towards the edges of the ring, so the turn reads as depth, not a pile-up
        const edge = (v) => { const k = Math.min(1, Math.max(0, (v - 0.2) / 0.45)); return k * k * (3 - 2 * k); };
        e.style.opacity = z > 0 ? edge(z) : 0.3 * edge(-z);
        e.style.color = z > 0 ? '#C9972A' : '#FAF6F0'; // gold in front reads on the white label and the dark ground alike
        e.style.textShadow = z > 0 ? '0 2px 10px rgba(0,0,0,.45)' : 'none';
        (z > 0 ? rf : rb).appendChild(e);
      });
    },
    caption: {
      el: 'Το σύνθημα που γράφει το ποτήρι μας: γεύση απ\' τον παράδεισο, σε κάθε ποτήρι. Ρόδου 68, Κάτω Πατήσια.',
      en: 'The line printed on our cup: a taste of heaven in every cup. Rodou 68, Kato Patisia.',
    },
  },
  {
    id: 'reel-hours',
    bg: 'slat-wall',
    seconds: 10,
    front: `<div class="txt">
      <div class="kicker">Καθε μερα / Every day</div>
      <h1 id="clock" style="font-size:190px;margin-top:10px;font-variant-numeric:tabular-nums">07:00</h1>
      <div class="lede fade" id="l">Από τις 07:00 έως τις 22:00.</div>
    </div>${foot}`,
    frame: (s, $) => {
      const a = $.io($.seg(s, 0.6, 7.4));
      // the key light is the sun: rises low on the left, crosses over the lid, sets low on the right
      const sun = $.lerp(-0.45, 0.45, a) * Math.PI;
      $.pose({ ...$.LID, rot: $.lerp(-0.04, 0.04, a), cam: [0, 150, 830], look: [0, 36, 0], fov: 26,
        keyPos: [480 * Math.sin(sun), 130 + 360 * Math.cos(sun), 300], keyI: 9000 + 5000 * Math.cos(sun), keyAngle: 0.5,
        exposure: 0.85 + 0.2 * Math.cos(sun), steam: s });
      const m = 7 * 60 + Math.round(15 * 60 * a / 5) * 5;
      $.q('#clock').textContent = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      $.q('#ground').style.filter = `brightness(${0.75 + 0.45 * Math.cos(sun)})`;
      $.show('#l', $.seg(s, 7.6, 8.3), 20);
    },
    caption: {
      el: 'Από τις 07:00 έως τις 22:00, κάθε μέρα. Ρόδου 68, Κάτω Πατήσια.',
      en: 'From 07:00 to 22:00, every day. Rodou 68, Kato Patisia.',
    },
  },
  {
    id: 'reel-delivery',
    seconds: 8,
    back: `<div id="pat" style="position:absolute;inset:-300px;opacity:.07;display:flex;flex-wrap:wrap;gap:44px 40px;--s:url(${stamp})">
      ${'<i style="width:70px;height:120px;background:var(--s) center/contain no-repeat"></i>'.repeat(220)}</div>`,
    front: `<div class="txt">
      <h1 class="fade" id="h" style="font-size:92px;margin-top:0">Φέρνουμε τον καφέ<br><em>σε σένα.</em></h1>
      <div id="tiles" style="display:flex;justify-content:center;gap:28px;margin-top:40px">
        ${['efood-logo.webp', 'wolt-logo.webp', 'box-logo.png'].map((f) => `<span class="tile fade" style="width:150px;height:150px;border-radius:30px;background:${BRAND.ink};display:flex;align-items:center;justify-content:center;padding:20px"><img src="${asset(f)}" style="max-width:100%;max-height:100%"></span>`).join('')}
      </div>
    </div>${foot}`,
    frame: (s, $) => {
      const a = $.out($.seg(s, 0, 1.6));
      $.pose({ ...$.LID, rot: $.lerp(-0.5, 0, a), lean: 0, tilt: -0.25 * (1 - a) * (1 - a), cam: [$.lerp(-520, 0, a), 150, 830], look: [$.lerp(-520, 0, a), 36, 0], fov: 26, steam: s });
      $.q('#pat').style.transform = `rotate(-12deg) translateY(${-s * 14}px)`;
      $.show('#h', $.out($.seg(s, 1.7, 2.6)), 40);
      [...document.querySelectorAll('.tile')].forEach((e, i) => {
        const v = $.seg(s, 2.8 + i * 0.35, 3.4 + i * 0.35);
        e.style.opacity = Math.min(1, v * 2); e.style.transform = `scale(${$.back(v)})`;
      });
    },
    caption: {
      el: 'Φέρνουμε τον καφέ σε σένα: e-food, Wolt και Box. Κάθε μέρα 07:00 – 22:00.',
      en: 'We bring the coffee to you: e-food, Wolt and Box. Every day 07:00 – 22:00.',
    },
  },
  // ─── Photo reels from the 2026-10-26 shoot. Like stories, they may reuse a shot that backs a feed post. ──
  {
    id: 'reel-bean-to-cup',
    photo: true,
    seconds: 12,
    back: shots([['beans-macro', 0, 2], ['grinder-pour', 2, 4], ['espresso-splash', 4, 6], ['crema-double', 6, 8], ['milk-close', 8, 10], ['staff-cup', 10, 13]]),
    front: lines('Η γενεση', [['Στην αρχή,<br><em>ο κόκκος.</em>', 0.3, 2], ['Μετά,<br><em>ο μύλος.</em>', 2.1, 4], ['Και είδαμε ότι<br><em>ήταν καλό.</em>', 4.1, 6],
      ['Πολύ <em>καλό.</em>', 6.1, 8], ['Λίγο <em>γάλα.</em>', 8.1, 10], ['Και τέλος,<br><em>ο δικός σου.</em>', 10.1, 99]], ['Ρόδου 68 · από τις 07:00', 10.6]),
    frame: (s, $) => $.photos(s),
    caption: {
      el: 'Στην αρχή ήταν ο κόκκος. Η Γένεση του καφέ σου, σε 12 δευτερόλεπτα. Ρόδου 68, από τις 07:00.',
      en: 'In the beginning there was the bean. The Genesis of your coffee, in 12 seconds. Rodou 68, from 7am.',
    },
  },
  {
    id: 'reel-shop',
    photo: true,
    seconds: 10,
    back: shots([['storefront-leaves', 0, 2.5, 1, 1.05, 0, true], ['storefront-glass', 2.5, 5, 1, 1.05, 0, true], ['sign-round', 5, 7.5, 1, 1.05, 0, true], ['interior', 7.5, 11]]),
    front: lines('Ροδου 68', [['Η γωνιά σου<br><em>στα Πατήσια.</em>', 0.4, 4.9], ['Από <em>το 2024.</em>', 5.1, 7.4], ['Κάτσε <em>λίγο.</em>', 7.6, 99]],
      ['Κάθε μέρα 07:00 – 22:00', 8.2]),
    frame: (s, $) => $.photos(s),
    caption: {
      el: 'Ρόδου 68, Κάτω Πατήσια. Coffee & spirits, κάθε μέρα 07:00 – 22:00. Κάτσε λίγο.',
      en: 'Rodou 68, Kato Patisia. Coffee & spirits, every day 07:00 – 22:00. Stay a while.',
    },
  },
  {
    id: 'reel-vitrine',
    photo: true,
    seconds: 10,
    back: shots([['vitrine-tall', 0, 2], ['pastry-sesame', 2, 4], ['vitrine-peinirli', 4, 6], ['pie-macro', 6, 8], ['snack-cup', 8, 11]]),
    front: lines('Η βιτρινα', [['Κάτι για <em>λιγούρα;</em>', 0.4, 3.9], ['Πεϊνιρλί <em>2.90€.</em>', 4.1, 5.9], ['Μην <em>αντισταθείς.</em>', 6.1, 7.9], ['Πρωινό, <em>λυμένο.</em>', 8.1, 99]],
      ['Από τις 07:00, Ρόδου 68', 8.6]),
    frame: (s, $) => $.photos(s),
    caption: {
      el: 'Κάτι για τη λιγούρα; Πεϊνιρλί 2.90€, κρουασάν 2.50€, μπουγάτσα κρέμα 2.80€, τυρόπιτα 1.90€. Η βιτρίνα γεμίζει από τις 07:00.',
      en: 'Something for the craving? Peinirli €2.90, croissant €2.50, cream bougatsa €2.80, cheese pie €1.90. The counter fills up from 7am.',
    },
  },
  {
    id: 'reel-day',
    photo: true,
    seconds: 12,
    back: shots([['storefront-glass', 0, 2, 1, 1.05, 0, true], ['staff-machine', 2, 4], ['cup-counter', 4, 6], ['vitrine-window', 6, 8], ['staff-back', 8, 10], ['shutter-faith', 10, 13]]),
    front: `<img class="mark" src="${logo}"><div class="txt">
      <div class="kicker">Καθε μερα / Every day</div>
      <h1 id="clock" style="font-size:190px;margin-top:10px;font-variant-numeric:tabular-nums">07:00</h1>
      <div class="lede fade" id="l">Από τις 07:00 έως τις 22:00.</div>
    </div>${foot}`,
    frame: (s, $) => {
      $.photos(s);
      const m = 7 * 60 + Math.round(15 * 60 * $.io($.seg(s, 0.5, 10.5)) / 5) * 5;
      $.q('#clock').textContent = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      $.show('#l', $.seg(s, 10.6, 11.2), 20);
    },
    caption: {
      el: 'Μια μέρα στο Blessed, από τις 07:00 ως τις 22:00. Κάθε μέρα, και Κυριακή. Ρόδου 68.',
      en: 'A day at Blessed, from 07:00 to 22:00. Every day, Sundays too. Rodou 68.',
    },
  },
  {
    id: 'reel-faith',
    photo: true,
    seconds: 7,
    back: shots([['shutter-faith', 0, 8, 1.0, 1.08, 0, true]]),
    front: lines('Faith over fear', [['Άγχος;<br><em>Καφές.</em>', 1.2, 99]], ['Ρόδου 68, Κάτω Πατήσια', 2.6]),
    frame: (s, $) => $.photos(s),
    caption: {
      el: 'Λιγότερο άγχος, περισσότερος καφές. Faith over fear, Ρόδου 68.',
      en: 'Less worry, more coffee. Faith over fear, Rodou 68.',
    },
  },
  {
    id: 'reel-team',
    photo: true,
    seconds: 10,
    back: shots([['staff-profile', 0, 2.5], ['staff-wide', 2.5, 5], ['milk-steam', 5, 7.5], ['apron-cup', 7.5, 11]]),
    front: lines('Πισω απο τον παγκο', [['Η <em>βάρδια.</em>', 0.4, 4.9], ['Με <em>το χέρι.</em>', 5.1, 7.4], ['Για <em>σένα.</em>', 7.6, 99]],
      ['Κάθε μέρα 07:00 – 22:00', 8.2]),
    frame: (s, $) => $.photos(s),
    caption: {
      el: 'Πίσω από τον πάγκο, κάθε μέρα 07:00 – 22:00. Ο καφές σου, με το χέρι. Ρόδου 68.',
      en: 'Behind the counter, every day 07:00 – 22:00. Your coffee, made by hand. Rodou 68.',
    },
  },
];

// ─── RENDER ──────────────────────────────────────────────────────────────────
const HELPERS = `
  const $ = window.$ = {
    q: (sel) => document.querySelector(sel),
    seg: (s, a, b) => Math.min(1, Math.max(0, (s - a) / (b - a))),
    lerp: (a, b, t) => a + (b - a) * t,
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    back: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
    bounce: (t) => { const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
    show: (sel, v, dy = 0) => { const e = document.querySelector(sel); e.style.opacity = v; e.style.transform = 'translateY(' + (1 - v) * dy + 'px)'; },
    pose: (o) => document.getElementById('cup').contentWindow.pose(o),
    photos: (s) => {
      document.querySelectorAll('.sh').forEach((e) => {
        const a = +e.dataset.a, b = +e.dataset.b, k = $.seg(s, a - 0.4, b + 0.4);
        e.style.opacity = s > b + 0.4 ? 0 : $.seg(s, a - 0.4, a) || (a === 0 ? 1 : 0);
        e.style.transform = 'scale(' + $.lerp(+e.dataset.z0, +e.dataset.z1, k) + ') translateX(' + $.lerp(0, +e.dataset.px, k) + 'px)';
      });
      document.querySelectorAll('.t').forEach((e) => {
        const a = +e.dataset.a, b = +e.dataset.b;
        $.show('#' + e.id, Math.min($.out($.seg(s, a, a + 0.5)), 1 - $.seg(s, b - 0.3, b)), 30);
      });
    },
    PANEL: ${JSON.stringify(PANEL)}, LID: ${JSON.stringify(LID)}, LABEL: ${JSON.stringify(LABEL)},
  };`;

const argv = process.argv.slice(2);
const peek = argv.includes('--peek');
const only = argv.filter((a) => !a.startsWith('--'));
const reels = only.length ? REELS.filter((r) => only.includes(r.id)) : REELS;
if (!reels.length) {
  console.error(`No matching reels. Available: ${REELS.map((r) => r.id).join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const srv = await serve(ROOT, PORT);
const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function render(reel) {
  const dir = `${TMP}/${reel.id}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto(`http://127.0.0.1:${PORT}/social/cup/serve.mjs`); // any same-origin URL, so the iframe's pose() is reachable
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>
    <div id="ground">${reel.bg ? `<img src="/social/photos/shoot/${reel.bg}.jpg"><i></i>` : ''}</div><div id="back" class="layer">${reel.back || ''}</div>
    ${reel.photo ? '' : '<iframe id="cup" src="/social/cup/cup.html?clean"></iframe>'}<div id="front" class="layer">${reel.front || ''}</div>
    <script>${HELPERS}; window.F = ${reel.frame.toString()};</script>`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth), null, { timeout: 60000 });
  if (!reel.photo) await page.waitForFunction(() => document.getElementById('cup').contentWindow.ready, null, { timeout: 180000 });
  await page.evaluate(() => document.fonts.ready);
  const n = reel.seconds * FPS;
  const frames = peek ? [0, 0.15, 0.35, 0.55, 0.75, 0.97].map((f) => Math.round(f * n)) : [...Array(n).keys()];
  for (const [j, i] of frames.entries()) {
    await page.evaluate((s) => window.F(s, window.$), i / FPS);
    await page.screenshot({ path: `${dir}/${String(j).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 95 });
  }
  await page.close();
  if (peek) {
    execFileSync('python3', ['-c', `
import sys, glob
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + '/*.jpg')); W = Image.new('RGB', (360 * len(fs), 640))
for i, f in enumerate(fs): W.paste(Image.open(f).resize((360, 640)), (360 * i, 0))
W.save(sys.argv[2], quality=85)`, dir, `${TMP}/${reel.id}-peek.jpg`]);
    console.log(`peek ${TMP}/${reel.id}-peek.jpg`);
    return;
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${dir}/%04d.jpg`,
    '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}/${reel.id}.mp4`]);
  writeFileSync(`${OUT}/${reel.id}.txt`, `${reel.caption.el}\n\n${reel.caption.en}\n\n${TAGS}\n`);
  rmSync(dir, { recursive: true, force: true });
  console.log(`rendered ${reel.id} (${reel.seconds}s)`);
}

const queue = [...reels];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (queue.length) await render(queue.shift()); }));
await browser.close();
srv.close();
if (!peek) rmSync(TMP, { recursive: true, force: true });
console.log(`\n${reels.length} reel(s) in social/library-reels/`);
