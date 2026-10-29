// Renders the Blessed Coffee social content library.
//   node social/render.mjs            all posts
//   node social/render.mjs hours early only these ids
//
// Every fact below is copied from src/data/site.js or the live site. Nothing here is
// invented: a wrong price or a wrong opening time published to 721 followers is
// worse than no post at all.

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = `${ROOT}/social/library`;
const TMP = `${ROOT}/social/.render-tmp`;

// Playwright's browser, downloaded by the MCP server. Override if it moves.
const CHROME =
  process.env.CHROME_PATH ||
  '/home/akos/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';

const W = 1080;
const H = 1350; // IG portrait: the most feed real estate a single image can take.
const SCALE = 2; // render at 2x, supersample down, so small type stays crisp.

const BRAND = {
  address: 'ΡΟΔΟΥ 68 · ΚΑΤΩ ΠΑΤΗΣΙΑ',
  site: 'BLESSED.CAFE',
  ink: '#FAF6F0',
  gold: '#C9972A',
  ground: '#0A0A0A',
  muted: '#8A7060',
};

const mime = (f) => (f.endsWith('.png') ? 'png' : f.endsWith('.jpg') || f.endsWith('.jpeg') ? 'jpeg' : 'webp');
const dataUri = (path, f) => `data:image/${mime(f)};base64,${readFileSync(`${path}/${f}`).toString('base64')}`;

const logo = `data:image/webp;base64,${readFileSync(`${ROOT}/public/blessed-logo.webp`).toString('base64')}`;
const asset = (f) => dataUri(`${ROOT}/public`, f);
// Real shop photography: the cup, the machine, the storefront. No scrim needed,
// this IS the product. No AI imagery anywhere in the library (dropped 2026-09-25).
const photo = (f) => dataUri(`${ROOT}/social/photos`, f);
// The 3D cup, built from real photos of the real cup (social/cup/). Posed stills are rendered on
// demand by cup/shots.mjs; the two cutouts are the recurring brand mark (corner stamp, sticker, pattern).
const CUP = `${ROOT}/social/cup`;
const shot = (name) => {
  if (!existsSync(`${CUP}/shots/${name}.png`)) execFileSync('node', [`${CUP}/shots.mjs`, name], { stdio: 'inherit' });
  return dataUri(`${CUP}/shots`, `${name}.png`);
};
const stamp = dataUri(CUP, 'cup-watermark-white.png');
// A shoot photo as the room around the 3D cup (no signage shots, so nothing branded gets cut).
const backdrop = (img) => `<img class="backdrop" src="${dataUri(`${ROOT}/social/photos/shoot`, `${img}.jpg`)}"><div class="backshade"></div>`;
const sticker = dataUri(CUP, 'cup-watermark.png');

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Barlow+Semi+Condensed:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px; overflow: hidden;
    background: ${BRAND.ground}; color: ${BRAND.ink};
    font-family: 'Barlow Semi Condensed', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  /* Directional tonal shift, not a radial glow: a glow halo is the classic
     generated-UI tell. Darker where the type sits, lighter behind the mark. */
  .card {
    position: relative; width: 100%; height: 100%;
    display: flex; flex-direction: column;
    padding: 84px 76px 64px;
    background: linear-gradient(168deg, #151210 0%, ${BRAND.ground} 58%, #060606 100%);
  }
  /* Backdrop layer for real photos (always with .real below). */
  .bg { position: absolute; inset: 0; z-index: 0; }
  .bg img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(0.55) contrast(1.05); }
  .bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(8,8,8,.72) 0%, rgba(8,8,8,.88) 55%, rgba(6,6,6,.96) 100%);
  }
  /* Real shop photos get a light bottom-only fade for caption legibility, not
     a heavy full-frame scrim. No grayscale/contrast either. */
  .bg.real img { filter: none; }
  .bg.real::after {
    background: linear-gradient(180deg, rgba(8,8,8,.05) 0%, rgba(8,8,8,.2) 60%, rgba(6,6,6,.9) 100%);
  }
  .card > *:not(.bg) { position: relative; z-index: 1; }
  .mark { width: 150px; filter: invert(1); opacity: .94; }
  .mark.big { width: 300px; }
  /* Bottom-anchored: centring the body left a dead top third on every card.
     Anchoring to the footer reads as deliberate editorial space instead. */
  .body { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 26px; padding-bottom: 18px; }
  .body.tight { gap: 16px; }
  .body.center { justify-content: center; align-items: center; text-align: center; }
  .kicker {
    font-size: 27px; font-weight: 600; letter-spacing: .34em; text-transform: uppercase;
    color: ${BRAND.gold};
  }
  h1 {
    font-family: 'Playfair Display', serif; font-weight: 600;
    font-size: 116px; line-height: .96; letter-spacing: -.015em;
  }
  h1.sm { font-size: 88px; }
  h1 em { font-style: italic; color: ${BRAND.gold}; }
  .lede { font-size: 38px; font-weight: 300; line-height: 1.34; color: #CFC6BC; max-width: 23ch; }
  .rule { width: 132px; height: 3px; background: ${BRAND.gold}; }
  .rows { display: flex; flex-direction: column; gap: 20px; }
  .row { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; }
  .row .k { font-size: 40px; font-weight: 500; letter-spacing: .01em; }
  .row .v { font-family: 'Playfair Display', serif; font-size: 46px; color: ${BRAND.gold}; white-space: nowrap; }
  .row .dots { flex: 1; border-bottom: 2px dotted #3A322C; transform: translateY(-10px); }
  .el { color: ${BRAND.muted}; font-size: 30px; font-weight: 400; letter-spacing: .04em; }
  .foot {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 30px; border-top: 1px solid #2A2422;
    font-size: 25px; font-weight: 500; letter-spacing: .2em; color: #6E645C;
  }
  /* e-food and Wolt ship as solid-colour tiles with no alpha, so whiting them
     out erased them. Uniform light chips instead: each keeps its real colour. */
  .partners { display: flex; align-items: center; gap: 26px; }
  .partners span {
    width: 150px; height: 150px; border-radius: 30px; background: ${BRAND.ink};
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .partners img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .big-price {
    font-family: 'Playfair Display', serif; font-size: 250px; line-height: .85;
    color: ${BRAND.gold};
  }
  .big-price small { font-size: 86px; }
  .stars { color: ${BRAND.gold}; font-size: 32px; letter-spacing: 10px; }
  .quote {
    font-family: 'Playfair Display', serif; font-style: italic; font-weight: 400;
    font-size: 46px; line-height: 1.3; max-width: 21ch;
  }
  .attrib { font-size: 27px; font-weight: 500; color: ${BRAND.muted}; letter-spacing: .03em; }
  /* ─── 3D cup cards ─── */
  .card.cupground { background: linear-gradient(180deg, #1B1611 0%, #110E0B 48%, #070707 100%); }
  .card > .shot { position: absolute; z-index: 0; pointer-events: none; }
  .card > .fill { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; }
  .card > .fade { position: absolute; inset: 0; z-index: 0;
    background: linear-gradient(180deg, rgba(8,8,8,0) 30%, rgba(8,8,8,.86) 62%, rgba(6,6,6,.98) 82%); }
  /* Shop photo behind a 3D cup: blurred and darkened so the cup reads, dark at the bottom for type. */
  .card > .backdrop { position: absolute; left: -40px; top: -40px; width: calc(100% + 80px); height: calc(100% + 80px);
    object-fit: cover; filter: blur(12px) brightness(.5) saturate(.95); z-index: 0; }
  .card > .backshade { position: absolute; inset: 0; z-index: 0;
    background: linear-gradient(180deg, rgba(8,8,8,.35) 0%, rgba(8,8,8,.08) 35%, rgba(8,8,8,.72) 70%, rgba(6,6,6,.95) 100%); }
  /* Corner mark: the white cup stamp, same spot on every photo card, so the grid reads as one set. */
  .card > .corner { position: absolute; top: 70px; right: 72px; width: 58px; opacity: .92; z-index: 2; }
  /* Sticker: colour cutout with a die-cut white edge and a real drop shadow. */
  .card > .sticker { position: absolute; z-index: 2;
    filter: drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff) drop-shadow(0 22px 26px rgba(0,0,0,.55)); }
  /* Pattern ground: the white stamp tiled at low opacity, rotated, behind type only. */
  .card > .pattern { position: absolute; inset: -200px; z-index: 0; opacity: .06; transform: rotate(-12deg);
    display: flex; flex-wrap: wrap; gap: 40px 38px; }
  .card > .pattern i { width: 64px; height: 110px; background: var(--s) center / contain no-repeat; }
  .idx { font-size: 26px; font-weight: 600; letter-spacing: .3em; color: ${BRAND.muted}; }
  .swipe { font-size: 26px; font-weight: 500; letter-spacing: .3em; color: ${BRAND.gold}; text-transform: uppercase; }
  .cols { display: flex; justify-content: flex-end; gap: 22px; font-size: 22px; font-weight: 600; letter-spacing: .24em; color: ${BRAND.muted}; }
  .cols span { width: 130px; text-align: right; }
  .rows.menu { gap: 10px; }
  .rows.menu .k { font-size: 34px; }
  .rows.menu .v { font-size: 36px; width: 130px; text-align: right; }
  .rows.menu .v + .v { margin-left: -2px; }
  /* ─── Series cards (2026-09-26, Blank Street playbook): one flat ground per series so the grid
     reads as recurring shows, big conversational type, the fact as the punchline. ─── */
  .card.s { --i: ${BRAND.ink}; --m: ${BRAND.muted}; --e: ${BRAND.gold}; --line: #2A2422; color: var(--i); padding-top: 72px; }
  .card.s-gold { background: ${BRAND.gold}; --i: #0A0A0A; --m: rgba(10,10,10,.66); --e: #0A0A0A; --line: rgba(10,10,10,.28); }
  .card.s-cream { background: #F3EDE4; --i: #0A0A0A; --m: #6B5A4C; --e: #8A6414; --line: #D9CFC2; }
  .card.s-winter { background: linear-gradient(180deg, #33231A 0%, #22170F 100%); --m: #B8A596; --line: #4A382C; }
  /* Photographer shot behind a series card: dark at the top for the headline, at the bottom for the rows. */
  .card.s > .fade.both { background: linear-gradient(180deg, rgba(8,8,8,.9) 0%, rgba(8,8,8,.6) 30%, rgba(8,8,8,.25) 50%, rgba(6,6,6,.94) 86%); }
  .card.s-summer { background: #D7E6E8; --i: #0A0A0A; --m: #4F5F63; --e: #8A6414; --line: #B5C8CB; }
  .s-gold .mark, .s-cream .mark, .s-summer .mark { filter: none; }
  /* Any ground with a photo behind it goes light-on-dark, whatever its own colours are. */
  .card.s.photo { --i: ${BRAND.ink}; --m: #D8CFC6; --e: ${BRAND.gold}; --line: rgba(255,255,255,.2); }
  .card.s.photo .mark { filter: invert(1); }
  .s .mark { width: 120px; }
  .stop { display: flex; justify-content: space-between; align-items: center; }
  .tag { font-size: 28px; font-weight: 600; letter-spacing: .3em; text-transform: uppercase; }
  .say { font-family: 'Playfair Display', serif; font-weight: 600; font-size: 150px; line-height: .98; letter-spacing: -.02em; margin-top: 96px; }
  .say.sm { font-size: 118px; }
  .say.q { font-size: 96px; line-height: 1.1; font-style: italic; font-weight: 400; }
  .say em { color: var(--e); }
  .tail { margin-top: auto; padding-bottom: 30px; display: flex; flex-direction: column; gap: 22px; }
  .sub { font-size: 40px; font-weight: 400; line-height: 1.3; color: var(--m); }
  .s .row .v { color: var(--e); }
  .s .row .dots { border-color: var(--line); }
  .s .foot { color: var(--m); border-color: var(--line); }
  /* ─── Photographer shoot (2026-10-26): full-bleed shot, light top fade for the mark, dark bottom for type. ─── */
  .card > .fade.pro { background: linear-gradient(180deg, rgba(8,8,8,.45) 0%, rgba(8,8,8,0) 16%, rgba(8,8,8,0) 42%, rgba(8,8,8,.62) 62%, rgba(6,6,6,.95) 84%); }
  .pro .kicker, .pro h1, .pro .lede { text-shadow: 0 1px 14px rgba(0,0,0,.6); }
  .pro .lede { color: #E4DCD2; }
  /* Photo-only post: the shot, the mark top left, the footer, nothing else. Short (landscape) ones tighten up. */
  .card > .fade.bare { background: linear-gradient(180deg, rgba(8,8,8,.42) 0%, rgba(8,8,8,0) 20%, rgba(8,8,8,0) 72%, rgba(6,6,6,.82) 100%); }
  .card.bare .foot { color: #D8CFC6; border-top-color: rgba(255,255,255,.18); }
  .card > .blurfill { filter: blur(34px) brightness(.42) saturate(.9); transform: scale(1.15); }
  /* Inset from the edges: the IG profile grid trims each tile to 3:4, which would clip edge-to-edge signage. */
  .card > .mid { position: absolute; left: 5%; width: 90%; z-index: 0; border-radius: 6px; box-shadow: 0 30px 60px rgba(0,0,0,.45); }
  /* Landscape shots don't survive a 4:5 crop: they sit as a full-width plate under the mark instead. */
  .card > .plate { position: absolute; left: 0; top: 0; width: 100%; height: 760px; object-fit: cover; z-index: 0; }
  .card > .plate + .fade { background: linear-gradient(180deg, rgba(8,8,8,.4) 0%, rgba(8,8,8,0) 18%, rgba(8,8,8,0) 42%, ${BRAND.ground} 57%); }
`;

const shell = (inner, bg, real, cls = '') => `<div class="card ${cls}">
  ${bg ? `<div class="bg${real ? ' real' : ''}"><img src="${bg}"></div>` : ''}
  ${inner}
  <div class="foot"><span>${BRAND.address}</span><span>${BRAND.site}</span></div>
</div>`;

// Series card. ground: gold (07:00), cream (Είπατε, reviews), black (Στο μενού).
const rows = (items) => `<div class="rows">${items.map(([k, v]) =>
  `<div class="row"><span class="k">${k}</span><span class="dots"></span><span class="v">${v}</span></div>`).join('')}</div>`;
// Photographer shots land in social/photos/shoot/<id>.jpg; until then the card renders text-only.
const shoot = (id) => existsSync(`${ROOT}/social/photos/shoot/${id}.jpg`) ? dataUri(`${ROOT}/social/photos/shoot`, `${id}.jpg`) : null;
const series = ({ ground, tag, say, cls = '', sub = '', extra = '', img = null }) =>
  shell(`${img ? `<img class="fill" src="${img}"><div class="fade both"></div>` : ''}<div class="stop"><img class="mark" src="${logo}"><span class="tag">${tag}</span></div>
  <div class="say ${cls}">${say}</div>
  <div class="tail">${extra}${sub ? `<div class="sub">${sub}</div>` : ''}</div>`, null, false, `s s-${ground}${img ? ' photo' : ''}" lang="el`);

// Photographer shot, full-bleed (or a landscape plate on top when plate: true), type at the bottom.
const pro = ({ img, kicker, h1, lede = '', sm = false, pos = 'center', plate = false }) =>
  shell(`<img class="${plate ? 'plate' : 'fill'}" src="${shoot(img)}" style="object-position:${pos}"><div class="fade pro"></div>
  <img class="mark" src="${logo}">
  <div class="body tight">
    <div class="kicker">${kicker}</div>
    <h1${sm ? ' class="sm"' : ''}>${h1}</h1>
    ${lede ? `<div class="rule"></div><div class="lede">${lede}</div>` : ''}
  </div>`, null, false, 'pro" lang="el');
// Carousel slide: a shot with an index line. Cover and end slides are plain pro()/series() cards.
const slide = ({ img, idx, h1, lede = '', pos = 'center' }) =>
  shell(`<img class="fill" src="${shoot(img)}" style="object-position:${pos}"><div class="fade pro"></div>
  <div class="body tight">
    <div class="idx">${idx}</div>
    <h1 class="sm">${h1}</h1>
    ${lede ? `<div class="lede">${lede}</div>` : ''}
  </div>`, null, false, 'pro" lang="el');

// Seeds customer photos of the cup (the "cup in the neighbourhood" repost series).
const TAG_US = {
  el: 'Τράβα το ποτήρι σου και κάνε tag @blessedcoffee2024.',
  en: 'Snap your cup and tag @blessedcoffee2024.',
};

// ─── POSTS ───────────────────────────────────────────────────────────────────
// caption.el / caption.en are published together: the cafe serves both languages
// and the existing feed already mixes them.
const POSTS = [
  // ─── 07:00: the morning-routine series, gold ground. Facts: hours + MENU only. ──
  {
    id: 'early',
    html: () => series({ ground: 'gold', tag: '07:00 · №01',
      say: 'Πρώτα<br>ο καφές.<br><em>Μετά όλα<br>τα άλλα.</em>',
      sub: 'Ανοιχτά κάθε μέρα από τις 07:00.' }),
    caption: {
      el: `Πρώτα ο καφές, μετά όλα τα άλλα. Ανοιχτά κάθε μέρα από τις 07:00, Ρόδου 68. ${TAG_US.el}`,
      en: `Coffee first, everything else after. Open every day from 7am, Rodou 68. ${TAG_US.en}`,
    },
  },
  {
    id: '0700-alarm',
    html: () => series({ ground: 'gold', tag: '07:00 · №02',
      say: 'Ξυπνητήρι:<br>06:45.<br><em>Blessed:<br>07:00.</em>',
      sub: 'Κάθε μέρα. Ρόδου 68, Κάτω Πατήσια.' }),
    caption: {
      el: `Ξυπνητήρι 06:45, Blessed 07:00. Κάθε μέρα, Ρόδου 68. ${TAG_US.el}`,
      en: `Alarm at 6:45, Blessed at 7:00. Every day, Rodou 68. ${TAG_US.en}`,
    },
  },
  {
    id: '0700-first',
    html: () => series({ ground: 'gold', tag: '07:00 · №03',
      say: 'Μη μου<br>μιλάς πριν<br>τον <em>πρώτο.</em>',
      sub: 'Εμείς καταλαβαίνουμε. Από τις 07:00.' }),
    caption: {
      el: `Μη μου μιλάς πριν τον πρώτο καφέ. Εμείς καταλαβαίνουμε, από τις 07:00. ${TAG_US.el}`,
      en: `Don't talk to me before the first coffee. We get it, from 7am. ${TAG_US.en}`,
    },
  },
  {
    id: '0700-breakfast',
    html: () => series({ ground: 'gold', tag: '07:00 · №04',
      say: 'Μπουγάτσα<br>και freddo.<br><em>Πρωινό.</em>',
      extra: rows([['Μπουγάτσα κρέμα', '2.80€'], ['Freddo espresso', '2.40€']]) }),
    caption: {
      el: `Μπουγάτσα κρέμα 2.80€ και freddo espresso 2.40€. Το πρωινό, λυμένο. Από τις 07:00. ${TAG_US.el}`,
      en: `Cream bougatsa €2.80 and a freddo espresso €2.40. Breakfast, sorted. From 7am. ${TAG_US.en}`,
    },
  },
  {
    id: '0700-sunday',
    html: () => series({ ground: 'gold', tag: '07:00 · №05',
      say: 'Κυριακή;<br><em>Ανοιχτά.</em>',
      sub: 'Κάθε μέρα 07:00 – 22:00. Ναι, κάθε μέρα.' }),
    caption: {
      el: `Κυριακή; Ανοιχτά. Κάθε μέρα 07:00 – 22:00, Ρόδου 68. ${TAG_US.el}`,
      en: `Sunday? Open. Every day 07:00 – 22:00, Rodou 68. ${TAG_US.en}`,
    },
  },
  {
    id: '0700-late',
    html: () => series({ ground: 'gold', tag: '07:00 · №06',
      say: 'Άργησες;<br>Είμαστε εδώ<br>ως τις <em>22:00.</em>',
      sub: 'Για τον δεύτερο. Ή τον τρίτο.' }),
    caption: {
      el: `Άργησες; Είμαστε εδώ ως τις 22:00. Για τον δεύτερο, ή τον τρίτο. ${TAG_US.el}`,
      en: `Running late? We're here until 10pm. For the second one, or the third. ${TAG_US.en}`,
    },
  },
  // ─── Καλοκαίρι: summer coffee, ice-blue ground. Χειμώνας: winter coffee, espresso-brown ground.
  //     All prices from MENU. Each card takes its photographer shot automatically once
  //     social/photos/shoot/<id>.jpg exists (see social/shot-list-seasonal.md). ──
  {
    id: 'summer-freddo',
    html: () => series({ ground: 'summer', tag: 'Καλοκαίρι · №01', img: shoot('summer-freddo'),
      say: 'Καύσωνας;<br><em>Freddo.</em>',
      extra: rows([['Freddo espresso', '2.40€'], ['Freddo cappuccino', '2.60€']]),
      sub: 'Με πολύ πάγο, από τις 07:00.' }),
    caption: {
      el: `Καύσωνας; Freddo. Freddo espresso 2.40€, freddo cappuccino 2.60€, με πολύ πάγο. Ρόδου 68, κάθε μέρα από τις 07:00. ${TAG_US.el}`,
      en: `Heatwave? Freddo. Freddo espresso €2.40, freddo cappuccino €2.60, plenty of ice. Rodou 68, every day from 7am. ${TAG_US.en}`,
    },
  },
  {
    id: 'summer-freddo-cappuccino',
    html: () => series({ ground: 'summer', tag: 'Καλοκαίρι · №02', img: shoot('summer-freddo-cappuccino'),
      say: 'Πάγος κάτω,<br><em>αφρός πάνω.</em>',
      extra: rows([['Freddo cappuccino', '2.60€']]),
      sub: 'Ο καφές του καλοκαιριού.' }),
    caption: {
      el: `Πάγος κάτω, αφρός πάνω. Freddo cappuccino 2.60€, ο καφές του καλοκαιριού. ${TAG_US.el}`,
      en: `Ice below, foam on top. Freddo cappuccino €2.60, the coffee of the summer. ${TAG_US.en}`,
    },
  },
  {
    id: 'winter-espresso',
    html: () => series({ ground: 'winter', tag: 'Χειμώνας · №01', img: shoot('espresso-steam'),
      say: 'Κρύο έξω.<br><em>Espresso</em><br>μέσα.',
      extra: rows([['Espresso', '2€']]),
      sub: 'Ζεστός, από τις 07:00.' }),
    caption: {
      el: `Κρύο έξω, espresso μέσα. Espresso 2€, κάθε μέρα από τις 07:00, Ρόδου 68. ${TAG_US.el}`,
      en: `Cold outside, espresso inside. Espresso €2, every day from 7am, Rodou 68. ${TAG_US.en}`,
    },
  },
  {
    id: 'winter-cappuccino',
    html: () => series({ ground: 'winter', tag: 'Χειμώνας · №02', img: shoot('cappuccino-foam'),
      say: 'Cappuccino.<br><em>Για τα κρύα<br>πρωινά.</em>',
      extra: rows([['Cappuccino', '2.60€']]),
      sub: 'Πάρ\' τον μαζί σου, σε ζεσταίνει ως τη δουλειά.' }),
    caption: {
      el: `Cappuccino 2.60€, για τα κρύα πρωινά. Πάρ' τον μαζί σου, σε ζεσταίνει ως τη δουλειά. Από τις 07:00. ${TAG_US.el}`,
      en: `Cappuccino €2.60, for the cold mornings. Take it with you, it keeps you warm all the way to work. From 7am. ${TAG_US.en}`,
    },
  },
  // ─── Στο μενού: the promos, black ground. Priced straight from MENU in src/App.jsx. ──
  {
    id: 'hours',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Ωράριο',
      say: '07:00 –<br>22:00.<br><em>Κάθε μέρα.</em>',
      sub: 'Ναι, και Κυριακή.' }),
    caption: {
      el: 'Είμαστε εδώ από τις 7 το πρωί ως τις 10 το βράδυ, κάθε μέρα. Και Κυριακή.',
      en: 'We open at 7am and close at 10pm, every day. Sundays too.',
    },
  },
  {
    id: 'espresso-price',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Espresso',
      say: 'Espresso.<br><em>2€.</em>',
      extra: rows([['Freddo espresso', '2.40€'], ['Freddo cappuccino', '2.60€']]),
      sub: 'Αυτό. Δεν έχουμε κάτι άλλο να πούμε.' }),
    caption: {
      el: 'Espresso 2€. Freddo espresso 2.40€. Freddo cappuccino 2.60€. Στα Κάτω Πατήσια, κάθε μέρα από τις 07:00.',
      en: 'Espresso €2. Freddo espresso €2.40. Freddo cappuccino €2.60. Kato Patisia, every day from 7am.',
    },
  },
  {
    id: 'delivery',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Delivery',
      say: 'Βαριέσαι<br>να κατέβεις;<br><em>Ερχόμαστε.</em>',
      extra: `<div class="partners">
          <span><img src="${asset('efood-logo.webp')}"></span>
          <span><img src="${asset('wolt-logo.webp')}"></span>
          <span><img src="${asset('box-logo.png')}"></span>
        </div>` }),
    caption: {
      el: 'Βαριέσαι να κατέβεις; Ερχόμαστε εμείς. e-food, Wolt και Box: ο καφές και η πίτα σου, στην πόρτα σου.',
      en: "Can't be bothered to come down? We'll come to you. e-food, Wolt and Box: coffee and pastries to your door.",
    },
  },
  {
    id: 'tagline',
    html: () =>
      shell(`<div class="body center">
        <img class="mark big" src="${logo}">
        <h1 class="sm" style="margin-top:28px">A taste of<br><em>heaven</em><br>in every cup.</h1>
        <div class="el" style="margin-top:8px">EST. 2024 · ΚΑΤΩ ΠΑΤΗΣΙΑ</div>
      </div>`),
    caption: {
      el: 'Μια γεύση παραδείσου σε κάθε φλιτζάνι. Ροδου 68, Κάτω Πατήσια.',
      en: 'A taste of heaven in every cup. Rodou 68, Kato Patisia.',
    },
  },
  // ─── Είπατε: real Google reviews (src/App.jsx reviews), cream ground. Card quotes are
  //     verbatim excerpts with accents restored; the caption carries the full text. ──
  {
    id: 'review-martha',
    html: () => series({ ground: 'cream', tag: 'Είπατε · ★★★★★', cls: 'q',
      say: '«Ωραίος καφές και κάτι για τη λιγούρα, είναι <em>ό,τι πρέπει.</em>»',
      sub: 'Martha Grigoriou, Google Maps' }),
    caption: {
      el: '"Ωραίος καφές και κάτι για τη λιγούρα, είναι ό,τι πρέπει, όταν συνοδεύεται από γρήγορη και ευγενική εξυπηρέτηση!" Έγραψε η Martha Grigoriou στο Google Maps.',
      en: '"Nice coffee and something for cravings, it\'s a must, with fast and polite service." From Martha Grigoriou, via Google Maps.',
    },
  },
  {
    id: 'review-ninaki',
    html: () => series({ ground: 'cream', tag: 'Είπατε · ★★★★★', cls: 'q',
      say: '«Ο καφές φοβερός, και από ποιότητα <em>και από τεχνική!</em>»',
      sub: 'Ninaki Euangelou, Google Maps' }),
    caption: {
      el: '"Τα παιδιά είναι καταπληκτικά, πολύ ομαδικά σε όλες τις βάρδιες, εξυπηρετικότατα κ αμεσότατα! Καθαρά, περιποιημένα, νόστιμα, ο καφές φοβερός και από ποιότητα και από τεχνική!" Έγραψε η Ninaki Euangelou στο Google Maps.',
      en: '"The guys are amazing, very helpful and direct, clean, and the coffee is awesome in quality and technique!" From Ninaki Euangelou, via Google Maps.',
    },
  },
  {
    id: 'review-icecube',
    html: () => series({ ground: 'cream', tag: 'Είπατε · ★★★★★', cls: 'q',
      say: '«Το μοναδικό μαγαζί που είδα στο ντελίβερι να σου στέλνουν <em>ποτηράκι με πάγο</em> για το energy drink.»',
      sub: 'Blackoni Chris, Google Maps' }),
    caption: {
      el: '"Το μοναδικό μαγαζί που είδα στο ντελίβερι να σου στέλνουν ποτηράκι με πάγο για το energy drink." Έγραψε ο Blackoni Chris στο Google Maps.',
      en: '"The only shop I\'ve seen on delivery that sends you a glass of ice for your energy drink." From Blackoni Chris, via Google Maps.',
    },
  },
  {
    id: 'review-mourati',
    html: () => series({ ground: 'cream', tag: 'Είπατε · ★★★★★', cls: 'q',
      say: '«Απ\' τους καλύτερους καφέδες <em>που έχω δοκιμάσει.</em>»',
      sub: 'Mourati, Google Maps' }),
    caption: {
      el: '"Απ\' τους καλύτερους καφέδες που έχω δοκιμάσει, ευγενέστατο προσωπικό και πολύ εξυπηρετικό, ευέλικτος χώρος μέσα και έξω." Από Mourati, στο Google Maps.',
      en: '"One of the best coffees I\'ve tried, very polite and helpful staff, space both inside and out." From Mourati, via Google Maps.',
    },
  },
  {
    id: 'review-korleone',
    html: () => series({ ground: 'cream', tag: 'Είπατε · ★★★★★', cls: 'q',
      say: '«Είχα καιρό να απολαύσω <em>έτσι καφέ!</em>»',
      sub: 'Κορλεόνε Γλύνος, Google Maps' }),
    caption: {
      el: '"Συγχαρητήρια, εξαιρετικός καφές παιδιά, μπράβο σας, είχα καιρό να απολαύσω έτσι καφέ! Έτυχε να παραγγείλω μέσω πλατφόρμας και έμεινα πολύ ικανοποιημένος." Έγραψε ο Κορλεόνε Γλύνος στο Google Maps.',
      en: '"Congratulations, excellent coffee, well done, it\'s been a while since I enjoyed a coffee like this! I ordered through a delivery app and was very satisfied." From Korleone Glynos, via Google Maps.',
    },
  },
  // ─── More Στο μενού. ─────────────────────────────────────────────────────────
  {
    id: 'old-school',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Οι κλασικοί', cls: 'sm',
      say: 'Ελληνικός.<br>Φίλτρου. Νες.<br><em>Εδώ είναι.</em>',
      extra: rows([['Ελληνικός', '1.80€'], ['Φίλτρου', '2€'], ['NES', '1.80€'], ['Americano', '2€']]) }),
    caption: {
      el: 'Ελληνικός, φίλτρου, νες, americano. Οι κλασικοί, στην τιμή που τους αξίζει.',
      en: 'Greek coffee, filter, NES, americano. The classics, at the price they deserve.',
    },
  },
  {
    id: 'bougatsa',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Πρωί',
      say: 'Μπουγάτσα<br><em>κρέμα.</em>',
      extra: rows([['Μπουγάτσα κρέμα', '2.80€'], ['Φλογέρα Φιλαδέλφεια', '2.80€'], ['Κρουασάν', '2.50€']]),
      sub: 'Φρέσκα, κάθε πρωί.' }),
    caption: {
      el: 'Μπουγάτσα κρέμα 2.80€. Φλογέρα Φιλαδέλφεια 2.80€. Κρουασάν 2.50€. Φρέσκα, κάθε πρωί.',
      en: 'Cream bougatsa €2.80. Philadelphia flogera €2.80. Croissant €2.50. Fresh, every morning.',
    },
  },
  {
    id: 'sweet-lineup',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Γλυκά',
      say: 'Γλυκό;<br><em>Ναι.</em>',
      extra: rows([['Cheesecake', '2.90€'], ['Sweet Dubai', '3.20€'], ['Black Forest', '3.20€'], ['Προφιτερόλ', '2.90€']]) }),
    caption: {
      el: 'Cheesecake, Sweet Dubai, Black Forest, προφιτερόλ. Τέσσερις επιλογές, μια αδυναμία.',
      en: 'Cheesecake, Sweet Dubai, Black Forest, profiterole. Four options, one weakness.',
    },
  },
  {
    id: 'savory-pastries',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Αλμυρά',
      say: 'Αλμυρό;<br><em>Επίσης ναι.</em>',
      extra: rows([['Τυρόπιτα Κουρού', '1.90€'], ['Ζαμπονοτυρόπιτα', '2.90€'], ['Λουκανικόπιτα', '2.50€'], ['Σπανακόπιτα με Τυρί', '2.50€']]) }),
    caption: {
      el: 'Τυρόπιτα κουρού, ζαμπονοτυρόπιτα, λουκανικόπιτα, σπανακόπιτα με τυρί. Φρέσκες, κάθε μέρα.',
      en: 'Kourou cheese pie, ham and cheese pie, sausage pie, spinach and cheese pie. Fresh, every day.',
    },
  },
  {
    id: 'beer',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Μπύρα',
      say: 'Και μπύρα.<br><em>Γιατί όχι;</em>',
      extra: rows([['Amstel', '4€'], ['Heineken', '4€'], ['Corona', '4€'], ['Alfa', '4€']]) }),
    caption: {
      el: 'Μπύρα υπάρχει και στο Blessed. Amstel, Heineken, Corona, Alfa.',
      en: "Yes, we've got beer too. Amstel, Heineken, Corona, Alfa.",
    },
  },
  // ─── Neighbourhood atmosphere: photographer shots (2026-10-26). ──
  {
    id: 'atmosphere-neighbourhood', bare: 'corner-wide',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Γειτονια</div>
        <h1 class="sm">Κάτω<br><em>Πατήσια.</em></h1>
        <div class="rule"></div>
        <div class="lede">Η γωνία μας, Ρόδου 68.</div>
      </div>`, bg, real),
    caption: {
      el: 'Η γωνία μας στα Κάτω Πατήσια. Ρόδου 68, κάθε μέρα 07:00 – 22:00.',
      en: 'Our corner of Kato Patisia. Rodou 68, every day 07:00 – 22:00.',
    },
  },
  {
    id: 'atmosphere-early', bare: 'storefront-leaves',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">07:00</div>
        <h1 class="sm">Από νωρίς,<br><em>είμαστε εδώ.</em></h1>
        <div class="rule"></div>
        <div class="lede">Ανοιχτά κάθε μέρα από τις 07:00.</div>
      </div>`, bg, real),
    caption: {
      el: 'Από νωρίς, είμαστε εδώ. Ανοιχτά κάθε μέρα από τις 07:00.',
      en: "We're here early. Open every day from 7am.",
    },
  },
  {
    id: 'find-us',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Βρειτε μας / Find us</div>
        <h1 class="sm">Ρόδου 68,<br><em>Κάτω Πατήσια.</em></h1>
        <div class="rule"></div>
        <div class="lede">Αθήνα 104 45</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-35-58.png'),
    real: true,
    caption: {
      el: 'Ρόδου 68, Κάτω Πατήσια, Αθήνα 104 45. Ελάτε να μας βρείτε.',
      en: '68 Rodou Street, Kato Patisia, Athens 104 45. Come find us.',
    },
  },
  // ─── Real shop photography. No scrim tricks needed, this is the actual product. ──
  {
    id: 'fresh-pour',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Espresso</div>
        <h1>Φρέσκος.<br><em>Πάντα.</em></h1>
        <div class="rule"></div>
        <div class="lede">Ένα σωστό espresso δεν βιάζεται.</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-36-13.png'),
    real: true,
    caption: {
      el: 'Ένα σωστό espresso δεν βιάζεται. Φρέσκος, κάθε φορά.',
      en: 'A proper espresso is never rushed. Fresh, every time.',
    },
  },
  {
    id: 'milk-pour',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Η τεχνη του καφε</div>
        <h1>Με<br><em>προσοχή.</em></h1>
        <div class="rule"></div>
        <div class="lede">Κάθε φλιτζάνι, ένα ένα.</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-34-43.png'),
    real: true,
    caption: {
      el: 'Κάθε φλιτζάνι, ένα ένα, με προσοχή.',
      en: 'Every cup, one at a time, with care.',
    },
  },
  {
    id: 'espresso-drip',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Χειροποιητο</div>
        <h1 class="sm">Σταγόνα<br><em>σταγόνα.</em></h1>
        <div class="rule"></div>
        <div class="lede">Καφές, όχι βιομηχανία.</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-34-55.png'),
    real: true,
    caption: {
      el: 'Σταγόνα σταγόνα. Καφές, όχι βιομηχανία.',
      en: 'Drop by drop. Coffee, not a production line.',
    },
  },
  {
    id: 'pour-detail',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Καθε παραγγελια</div>
        <h1 class="sm">Φτιαγμένη<br><em>τη στιγμή.</em></h1>
        <div class="rule"></div>
        <div class="lede">Όχι κουμπί, όχι μηχανή που αποφασίζει.</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-36-24.png'),
    real: true,
    caption: {
      el: 'Κάθε παραγγελία, φτιαγμένη τη στιγμή που τη ζητάς.',
      en: 'Every order, made the moment you ask for it.',
    },
  },
  // ─── Seasonal occasions: pure goodwill greetings only, no menu/offer/hours claim. ──
  {
    id: 'christmas',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Χριστουγεννα στο μαγαζι</div>
        <h1>Καλά<br><em>Χριστούγεννα.</em></h1>
        <div class="rule"></div>
        <div class="lede">Από το Blessed, σε όλη τη γειτονιά.</div>
      </div>`, bg, real),
    // Real photo of the actual shop, decorated, not an AI plate, beats it outright.
    bg: photo('Screenshot_2026-09-20_23-09-29.png'),
    real: true,
    caption: {
      el: 'Καλά Χριστούγεννα από όλους εμάς στο Blessed, σε όλη τη γειτονιά.',
      en: 'Merry Christmas from all of us at Blessed, to the whole neighbourhood.',
    },
  },
  {
    id: 'new-year',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight" style="justify-content:flex-start;padding-top:60px">
        <div class="kicker">Πρωτοχρονια</div>
        <h1 class="sm">Καλή<br><em>Χρονιά.</em></h1>
        <div class="rule"></div>
        <div class="lede">Ευχές από όλους εμάς στο Blessed.</div>
      </div>`, bg, real),
    // Fireworks over the Acropolis, 1 Jan 2018, by Γρηγόριος Αγγελίδης, CC BY-SA 4.0 (Wikimedia Commons,
    // File:Ακροπολις Πρωτοχρονια 1.jpg). The licence needs the credit line in the caption.
    bg: photo('acropolis-fireworks.jpg'),
    real: true,
    caption: {
      el: 'Καλή χρονιά από όλους εμάς στο Blessed. Ό,τι καλύτερο για σένα και τους δικούς σου.',
      en: 'Happy New Year from everyone at Blessed. All the best to you and yours.\n\nΦωτογραφία / Photo: Γρηγόριος Αγγελίδης, CC BY-SA 4.0, Wikimedia Commons.',
    },
  },
  {
    id: 'easter',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Πασχα</div>
        <h1 class="sm">Καλό<br><em>Πάσχα.</em></h1>
        <div class="rule"></div>
        <div class="lede">Καλή Ανάσταση, γειτονιά.</div>
      </div>`, bg, real),
    bg: shoot('slat-wall'),
    real: true,
    caption: {
      el: 'Καλό Πάσχα και καλή Ανάσταση, από όλους εμάς στο Blessed.',
      en: 'Happy Easter from everyone at Blessed.',
    },
  },
  {
    id: 'summer',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Καλοκαιρι</div>
        <h1 class="sm">Καλό<br><em>Καλοκαίρι.</em></h1>
        <div class="rule"></div>
        <div class="lede">Από το Blessed, σε όλη τη γειτονιά.</div>
      </div>`, bg, real),
    bg: shoot('cup-counter-2'),
    real: true,
    caption: {
      el: 'Καλό καλοκαίρι από όλους εμάς στο Blessed, σε όλη τη γειτονιά.',
      en: 'Happy summer from everyone at Blessed, to the whole neighbourhood.',
    },
  },
  {
    id: 'apokries',
    // The storefront, whole, as a full-width plate (not the Faith over fear shutter).
    html: () => pro({ img: 'storefront-glass', plate: true, kicker: 'Αποκριες', h1: 'Καλές<br><em>Απόκριες.</em>', lede: 'Με κέφι, στη γειτονιά μας.', sm: true }),
    caption: {
      el: 'Καλές Απόκριες από όλους εμάς στο Blessed.',
      en: 'Happy Apokries (Greek Carnival season) from everyone at Blessed.',
    },
  },
  // ─── The 3D cup (social/cup/), built from real photos of the real cup. ─────────
  // Product stills on brand grounds, a label carousel, and the cutout as a system mark.
  {
    id: 'cup-hero',
    html: () =>
      shell(`${backdrop('interior')}<img class="shot" src="${shot('hero-low')}" style="width:1170px;left:250px;top:-70px">
      <img class="mark" src="${logo}">
      <div class="body tight" style="max-width:480px">
        <div class="kicker">Take away</div>
        <h1>Πάρ' τον<br><em>μαζί</em><br>σου.</h1>
        <div class="rule"></div>
        <div class="lede" style="max-width:12ch">Κάθε μέρα, 07:00 – 22:00.</div>
      </div>`, null, false, 'cupground'),
    caption: {
      el: `Πάρ' τον μαζί σου. Ρόδου 68, Κάτω Πατήσια, κάθε μέρα 07:00 – 22:00. ${TAG_US.el}`,
      en: `Take it with you. Rodou 68, Kato Patisia, every day 07:00 – 22:00. ${TAG_US.en}`,
    },
  },
  {
    id: 'cup-lid',
    html: () =>
      shell(`${backdrop('beans-pile')}<img class="shot" src="${shot('lid-top')}" style="width:1000px;left:40px;top:10px">
      <svg class="shot" viewBox="0 0 1000 1000" style="width:1000px;left:40px;top:10px">
        <defs><path id="ring" d="M500,500 m-405,0 a405,405 0 1,1 810,0 a405,405 0 1,1 -810,0"/></defs>
        <text font-family="Barlow Semi Condensed" font-weight="600" font-size="30" fill="${BRAND.gold}">
          <textPath href="#ring" textLength="2500" lengthAdjust="spacing">ΡΟΔΟΥ 68 · ΚΑΤΩ ΠΑΤΗΣΙΑ · ΚΑΘΕ ΜΕΡΑ 07:00 – 22:00 · BLESSED.CAFE ·</textPath>
        </text>
      </svg>
      <img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Απο πανω</div>
        <h1 class="sm">Κλείσε το καπάκι.<br><em>Φύγαμε.</em></h1>
      </div>`, null, false, 'cupground'),
    caption: {
      el: `Κλείσε το καπάκι, φύγαμε. Ο καφές σου, έτοιμος για το δρόμο. Ρόδου 68, κάθε μέρα 07:00 – 22:00. ${TAG_US.el}`,
      en: `Snap the lid on and go. Your coffee, ready for the road. Rodou 68, every day 07:00 – 22:00. ${TAG_US.en}`,
    },
  },
  {
    id: 'cup-hot-coffee',
    html: () =>
      shell(`${backdrop('crema-double-2')}<img class="shot" src="${shot('front')}" style="width:940px;left:420px;top:40px">
      <img class="mark" src="${logo}">
      <div class="body tight" style="max-width:560px">
        <div class="kicker">Ζεστος καφες</div>
        <div class="rows" style="gap:14px;margin-top:10px">
          <div class="row"><span class="k">Espresso</span><span class="dots"></span><span class="v">2€</span></div>
          <div class="row"><span class="k">Americano</span><span class="dots"></span><span class="v">2€</span></div>
          <div class="row"><span class="k">Macchiato</span><span class="dots"></span><span class="v">2.10€</span></div>
          <div class="row"><span class="k">Cappuccino</span><span class="dots"></span><span class="v">2.60€</span></div>
          <div class="row"><span class="k">Capp. Latte</span><span class="dots"></span><span class="v">2.70€</span></div>
        </div>
        <div class="rule" style="margin-top:14px"></div>
        <div class="el">Σε ποτήρι που κρατάει ζεστό τον δρόμο.</div>
      </div>`, null, false, 'cupground'),
    caption: {
      el: 'Espresso 2€, americano 2€, macchiato 2.10€, cappuccino 2.60€, cappuccino latte 2.70€. Στη Ρόδου 68, κάθε μέρα από τις 07:00.',
      en: 'Espresso €2, americano €2, macchiato €2.10, cappuccino €2.60, cappuccino latte €2.70. Rodou 68, every day from 7am.',
    },
  },
  // Carousel: cover, one slide per label panel, then where and when. Publish as one post, in order.
  {
    id: 'cup-carousel-1',
    html: () =>
      shell(`${backdrop('slat-wall')}<img class="shot" src="${shot('hero-34')}" style="width:1030px;left:120px;top:10px">
      <img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Ενα ποτηρι</div>
        <h1>Τρεις<br><em>πλευρές.</em></h1>
        <div class="swipe" style="margin-top:14px">Συρε →</div>
      </div>`, null, false, 'cupground'),
    caption: {
      el: 'Ένα ποτήρι, τρεις πλευρές. Σύρε για να το γυρίσεις: το σήμα μας, το σύνθημά μας, ο καφές μας. Ποια είναι η δική σου;',
      en: 'One cup, three sides. Swipe to turn it: our mark, our motto, our coffee. Which side is yours?',
    },
  },
  {
    id: 'cup-carousel-2',
    html: () =>
      shell(`<img class="fill" src="${shot('logo-close')}"><div class="fade"></div>
      <img class="mark" src="${logo}">
      <div class="body tight">
        <div class="idx">01 / 03</div>
        <h1 class="sm">Coffee<br><em>&amp; spirits.</em></h1>
        <div class="lede">Το σήμα μας, από το 2024.</div>
      </div>`, null, false, 'cupground'),
  },
  {
    id: 'cup-carousel-3',
    html: () =>
      shell(`<img class="fill" src="${shot('slogan-close')}"><div class="fade"></div>
      <img class="mark" src="${logo}">
      <div class="body tight">
        <div class="idx">02 / 03</div>
        <h1 class="sm">Γεύση απ' τον<br><em>παράδεισο.</em></h1>
        <div class="lede">Σε κάθε ποτήρι.</div>
      </div>`, null, false, 'cupground'),
  },
  {
    id: 'cup-carousel-4',
    html: () =>
      shell(`<img class="fill" src="${shot('partner-close')}"><div class="fade"></div>
      <img class="mark" src="${logo}">
      <div class="body tight">
        <div class="idx">03 / 03</div>
        <h1 class="sm">Mrs Rose<br><em>Caffè.</em></h1>
        <div class="lede">Ο συνεργάτης μας στον καφέ.</div>
      </div>`, null, false, 'cupground'),
  },
  {
    id: 'cup-carousel-5',
    html: () =>
      shell(`${backdrop('interior-wide')}<img class="shot" src="${shot('front')}" style="width:760px;left:160px;top:-10px">
      <img class="mark" src="${logo}">
      <div class="body tight" style="align-items:center;text-align:center">
        <div class="kicker">Βρες το εδω</div>
        <h1 class="sm">Ρόδου 68,<br><em>Κάτω Πατήσια.</em></h1>
        <div class="rows" style="width:100%;margin-top:14px">
          <div class="row"><span class="k">ΚΑΘΕ ΜΕΡΑ</span><span class="dots"></span><span class="v">07:00 – 22:00</span></div>
        </div>
      </div>`, null, false, 'cupground'),
  },
  // ─── The cutout as a system element. ─────────────────────────────────────────
  {
    id: 'coffee-menu-pattern',
    html: () =>
      shell(`<div class="pattern" style="--s:url(${stamp})">${'<i></i>'.repeat(160)}</div>
      <img class="mark" src="${logo}">
      <div class="body tight" style="justify-content:center">
        <div class="kicker">Ο καφες μας / Our coffee</div>
        <div class="cols" style="margin-top:18px"><span>MRS ROSE</span><span>IL MODO</span></div>
        <div class="rows menu">
          ${[['Freddo Espresso', '2.40€', '2.30€'], ['Freddo Cappuccino', '2.60€', '2.50€'], ['Cappuccino Latte', '2.70€', '2.60€'],
             ['Cappuccino', '2.60€', '2.50€'], ['Espresso', '2€', '1.90€'], ['Macchiato', '2.10€', '2€'], ['Frappé', '1.80€', '–'],
             ['NES', '1.80€', '–'], ['Φίλτρου', '2€', '–'], ['Ελληνικός', '1.80€', '–'], ['Americano', '2€', '–']]
            .map(([k, a, b]) => `<div class="row"><span class="k">${k}</span><span class="dots"></span><span class="v">${a}</span><span class="v">${b}</span></div>`).join('')}
        </div>
      </div>`),
    caption: {
      el: 'Όλος ο καφές μας, Mrs Rose και Il Modo. Από espresso 1.90€ μέχρι freddo cappuccino 2.60€. Ρόδου 68, κάθε μέρα 07:00 – 22:00.',
      en: 'Our whole coffee menu, Mrs Rose and Il Modo. From espresso at €1.90 to freddo cappuccino at €2.60. Rodou 68, every day 07:00 – 22:00.',
    },
  },
  {
    id: 'stamp-machine',
    html: (bg, real) =>
      shell(`<div class="fade"></div><img class="corner" src="${stamp}">
      <img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Απο τη μηχανη</div>
        <h1 class="sm">Κατευθείαν<br><em>σε σένα.</em></h1>
        <div class="rule"></div>
        <div class="lede">Espresso 2€, για εδώ ή για το δρόμο.</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-35-16.png'),
    real: true,
    caption: {
      el: 'Από τη μηχανή, κατευθείαν σε σένα. Espresso 2€, για εδώ ή για το δρόμο.',
      en: 'Straight from the machine to you. Espresso €2, for here or to go.',
    },
  },
  {
    id: 'stamp-bar',
    html: (bg, real) =>
      shell(`<img class="sticker" src="${sticker}" style="width:220px;right:90px;top:120px;transform:rotate(9deg)">
      <img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Φρεσκο αλεσμα</div>
        <h1 class="sm">Αλέθεται<br><em>τη στιγμή.</em></h1>
        <div class="rule"></div>
        <div class="lede">Φρέσκος καφές, φτιαγμένος με μεράκι.</div>
      </div>`, bg, real),
    // Not 21-35-35: its chalkboard shows a happy-hour offer that isn't on the site.
    bg: photo('Screenshot_2026-09-20_21-36-37.png'),
    real: true,
    caption: {
      el: 'Αλέθεται τη στιγμή. Φρέσκος καφές, φτιαγμένος με μεράκι, κάθε μέρα από τις 07:00.',
      en: 'Ground on the spot. Fresh coffee, made with love, every day from 7am.',
    },
  },
  // ─── Photographer shoot, 2026-10-26 (social/photos/shoot/). One shot per feed post. Strong shots
  //     go out bare (bare: no card, no type, the line lives in the caption); type only where it works:
  //     prices, questions, CTAs, quotes. Logos and signage are never cropped: landscape shots keep
  //     their shape. Facts: hours, MENU prices, the phone on the site. ──────────────────────────────
  // Το μαγαζί
  {
    id: 'shop-storefront', bare: 'storefront-day', keep: 0.62, // trims the round sign the frame cuts
    caption: {
      el: 'Εδώ ξεκινάει η μέρα. Ρόδου 68, Κάτω Πατήσια, κάθε μέρα από τις 07:00.',
      en: 'This is where the day starts. Rodou 68, Kato Patisia, every day from 7am.',
    },
  },
  {
    id: 'shop-sign', bare: 'sign-round',
    caption: {
      el: 'Στη γειτονιά από το 2024. Ευχαριστούμε που μας κάνατε στέκι. Ρόδου 68.',
      en: 'In the neighbourhood since 2024. Thank you for making us your spot. Rodou 68.',
    },
  },
  {
    id: 'shop-faith', bare: 'shutter-faith',
    caption: {
      el: 'Λιγότερο άγχος, περισσότερος καφές. Το λέει και το ρολό μας: faith over fear.',
      en: 'Less worry, more coffee. Our shutter says it too: faith over fear.',
    },
  },
  {
    id: 'shop-shutter', bare: 'shutter-christ-2', keep: 0.76, // trims the round sign the frame cuts
    caption: {
      el: 'Αν βλέπεις το ρολό, είναι πριν τις 07:00 ή μετά τις 22:00. Όλες τις άλλες ώρες, ελάτε μέσα.',
      en: 'If you can see the shutter, it is before 07:00 or after 22:00. Any other time, come on in.',
    },
  },
  {
    id: 'shop-inside', bare: 'interior-wide',
    caption: {
      el: 'Κάτσε λίγο. Τα mail μπορούν να περιμένουν. Ρόδου 68, κάθε μέρα 07:00 – 22:00.',
      en: 'Sit for a bit. The emails can wait. Rodou 68, every day 07:00 – 22:00.',
    },
  },
  {
    id: 'shop-coffee-guide',
    html: () => pro({ img: 'coffee-guide', kicker: 'Τεστ', h1: 'Πες μου τι πίνεις,<br><em>να σου πω ποιος είσαι.</em>', sm: true }),
    caption: {
      el: 'Πες μου τι καφέ πίνεις, να σου πω ποιος είσαι. Freddo espresso σκέτος; Cappuccino; Ελληνικός μέτριος; Γράψ\' το στα σχόλια.',
      en: 'Tell me your coffee and I will tell you who you are. Plain freddo espresso? Cappuccino? Greek, medium sweet? Tell us in the comments.',
    },
  },
  // Ο καφές μας: Mrs Rose, priced from MENU.
  {
    id: 'menu-mrs-rose',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Mrs Rose', img: shoot('mrs-rose-tins'),
      say: 'Ο κλασικός<br><em>μας.</em>',
      extra: rows([['Espresso', '2€'], ['Freddo espresso', '2.40€'], ['Cappuccino', '2.60€']]) }),
    caption: {
      el: 'Mrs Rose Caffè, ο κλασικός μας. Espresso 2€, freddo espresso 2.40€, cappuccino 2.60€. Ρόδου 68, από τις 07:00.',
      en: 'Mrs Rose Caffè, our classic. Espresso €2, freddo espresso €2.40, cappuccino €2.60. Rodou 68, from 7am.',
    },
  },
  // Το ποτήρι
  {
    id: 'cup-slogan', bare: 'cup-black',
    caption: {
      el: `Ένας καφές για τον δρόμο; Ρόδου 68, κάθε μέρα από τις 07:00. ${TAG_US.el}`,
      en: `A coffee for the road? Rodou 68, every day from 7am. ${TAG_US.en}`,
    },
  },
  {
    id: 'cup-ready',
    html: () => pro({ img: 'cup-counter', kicker: 'Take away', h1: 'Κόλλησες στην κίνηση;<br><em>Τουλάχιστον έχεις καφέ.</em>', sm: true }),
    caption: {
      el: `Κόλλησες στην κίνηση; Τουλάχιστον έχεις καφέ. Ρόδου 68, κάθε μέρα 07:00 – 22:00. ${TAG_US.el}`,
      en: `Stuck in traffic? At least you have coffee. Rodou 68, every day 07:00 – 22:00. ${TAG_US.en}`,
    },
  },
  {
    id: 'cup-pair',
    html: () => pro({ img: 'cup-pair', kicker: 'Για δυο', h1: 'Κερνάς<br><em>ή κερνάω;</em>' }),
    caption: {
      el: 'Κερνάς ή κερνάω; Κάνε tag αυτόν που σου χρωστάει καφέ.',
      en: 'Your round or mine? Tag the one who owes you a coffee.',
    },
  },
  {
    id: 'cup-street',
    html: () => pro({ img: 'cup-street-left', kicker: 'Το ποτηρι στη γειτονια', h1: 'Τράβα το δικό σου.<br><em>Κάνε tag.</em>', lede: '@blessedcoffee2024', sm: true }),
    caption: {
      el: 'Το ποτήρι στη γειτονιά: ξεκινάμε εμείς. Τράβα κι εσύ το δικό σου, όπου κι αν το πας, και κάνε tag @blessedcoffee2024.',
      en: 'The cup around the neighbourhood: we go first. Snap yours wherever you take it and tag @blessedcoffee2024.',
    },
  },
  {
    id: 'cup-foam', bare: 'foam-macro',
    caption: {
      el: 'Η ζωή είναι μικρή για κακό cappuccino. 2.60€, κάθε μέρα από τις 07:00.',
      en: 'Life is too short for a bad cappuccino. €2.60, every day from 7am.',
    },
  },
  {
    id: 'cup-espresso', bare: 'espresso-logo-cup',
    caption: {
      el: 'Λίγη υπομονή, αξίζει. Espresso 2€, για εδώ ή για το δρόμο.',
      en: 'A little patience, it is worth it. Espresso €2, for here or to go.',
    },
  },
  // Από τον κόκκο: the process, bare shots, numbered in the captions.
  {
    id: 'bean-01', bare: 'beans-macro',
    caption: {
      el: 'Πριν γίνει η καλημέρα σου. Από τον κόκκο, 1/5.',
      en: 'Before it becomes your good morning. From the bean, 1/5.',
    },
  },
  {
    id: 'bean-02', bare: 'grinder-fill',
    caption: {
      el: 'Εμείς ξεκινάμε πριν από σένα. 2/5.',
      en: 'We start before you do. 2/5.',
    },
  },
  {
    id: 'bean-03', bare: 'espresso-splash',
    caption: {
      el: 'Το καλύτερο θέαμα της μέρας. 3/5.',
      en: 'The best view of the day. 3/5.',
    },
  },
  {
    id: 'bean-04', bare: 'crema-double',
    caption: {
      el: 'Διπλή δόση, πυκνή κρέμα. 4/5.',
      en: 'Double shot, thick crema. 4/5.',
    },
  },
  {
    id: 'bean-05', bare: 'milk-steam',
    caption: {
      el: 'Γάλα, ζεσταμένο σωστά. Cappuccino 2.60€, cappuccino latte 2.70€. 5/5.',
      en: 'Milk, steamed properly. Cappuccino €2.60, cappuccino latte €2.70. 5/5.',
    },
  },
  // Πίσω από τον πάγκο: the team (staff photographed at the shoot).
  {
    id: 'team-01', bare: 'staff-machine',
    caption: {
      el: 'Η παραγγελία σου, ξεκίνησε. Κάθε μέρα από τις 07:00.',
      en: 'Your order, on its way. Every day from 7am.',
    },
  },
  {
    id: 'team-02', bare: 'apron-cup',
    caption: {
      el: 'Ένα cappuccino, έρχεται. 2.60€, κάθε μέρα από τις 07:00.',
      en: 'One cappuccino, coming up. €2.60, every day from 7am.',
    },
  },
  {
    id: 'team-phone', bare: 'staff-jacket',
    caption: {
      el: 'Θα μας αναγνωρίσεις. Ή πάρε μας: 211 218 1815, Ρόδου 68, κάθε μέρα 07:00 – 22:00.',
      en: "You'll recognise us. Or call: 211 218 1815, Rodou 68, every day 07:00 – 22:00.",
    },
  },
  {
    id: 'team-03', bare: 'staff-back',
    caption: {
      el: 'Εδώ από τις 07:00 ως τις 22:00. Πέρνα να πεις μια καλημέρα.',
      en: 'Here from 07:00 to 22:00. Drop by and say good morning.',
    },
  },
  // Η βιτρίνα: pastries. Only items identified for sure get a name and a MENU price.
  {
    id: 'vitrine-peinirli',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Πεϊνιρλί', img: shoot('vitrine-peinirli'),
      say: 'Πεϊνιρλί,<br><em>ζεστό.</em>', cls: 'sm',
      extra: rows([['Πεϊνιρλί', '2.80€'], ['Κρουασάν', '2.50€']]) }),
    caption: {
      el: 'Πεϊνιρλί 2.80€, κρουασάν 2.50€. Φρέσκα στη βιτρίνα από τις 07:00.',
      en: 'Peinirli €2.80, croissant €2.50. Fresh in the window from 7am.',
    },
  },
  {
    id: 'vitrine-pies',
    html: () => series({ ground: 'black', tag: 'Στο μενού · Πίτες', img: shoot('vitrine-pies'),
      say: 'Πίτα;<br><em>Διάλεξε.</em>',
      extra: rows([['Τυρόπιτα', '1.60€'], ['Σπανακόπιτα', '2.50€'], ['Λουκανικόπιτα', '2.50€']]) }),
    caption: {
      el: 'Τυρόπιτα 1.60€, σπανακόπιτα 2.50€, λουκανικόπιτα 2.50€. Διάλεξε, από τις 07:00.',
      en: 'Cheese pie €1.90, spinach pie €2.50, sausage roll €2.50. Take your pick, from 7am.',
    },
  },
  {
    id: 'vitrine-craving', bare: 'pastry-sesame',
    caption: {
      el: 'Κάτι για τη λιγούρα, όπως το είπε κι η Martha στο Google. Η βιτρίνα γεμίζει από τις 07:00.',
      en: 'Something for the craving, as Martha put it on Google. The counter fills up from 7am.',
    },
  },
  {
    id: 'vitrine-plate', bare: 'pie-plate',
    caption: {
      el: 'Δεν έφαγες πρωινό. Το ξέρουμε. Για εδώ ή για το δρόμο, από τις 07:00.',
      en: "You skipped breakfast. We know. For here or to go, from 7am.",
    },
  },
  {
    id: 'vitrine-window', bare: 'vitrine-window',
    caption: {
      el: 'Ρίξε μια ματιά στη βιτρίνα και έλα να διαλέξεις. Σε περιμένουμε, Ρόδου 68, από τις 07:00.',
      en: 'Take a look at the counter and come pick something. We will be here, Rodou 68, from 7am.',
    },
  },
  {
    id: 'vitrine-snack', bare: 'snack-cup',
    caption: {
      el: `Το πρωινό, λυμένο, από τις 07:00. ${TAG_US.el}`,
      en: `Breakfast, sorted, from 7am. ${TAG_US.en}`,
    },
  },
  // ─── Carousels from the shoot: a type cover, bare middle slides (4:5, or the whole shot on the
  //     dark ground when it's landscape signage), a type end slide. Slide 1 carries the caption. ──
  {
    id: 'bean-carousel-1',
    html: () => pro({ img: 'beans-pour', kicker: 'Συρε →', h1: 'Πώς γίνεται<br><em>ο καφές σου.</em>', sm: true }),
    caption: {
      el: 'Πώς γίνεται ο καφές σου: άλεσμα, espresso, γάλα. Σύρε. Ρόδου 68, από τις 07:00.',
      en: 'How your coffee gets made: grind, espresso, milk. Swipe. Rodou 68, from 7am.',
    },
  },
  { id: 'bean-carousel-2', bare: 'beans-pile', fixed: true },
  { id: 'bean-carousel-3', bare: 'grinder-pour', fixed: true },
  { id: 'bean-carousel-4', bare: 'crema-double-2', fixed: true },
  { id: 'bean-carousel-5', bare: 'milk-close', fixed: true },
  { id: 'bean-carousel-6', bare: 'staff-cup', fixed: true },
  { id: 'bean-carousel-7', html: () => series({ ground: 'black', tag: 'Στο μενού', img: shoot('last-drop'),
      say: 'Μέχρι την<br><em>τελευταία.</em>', cls: 'sm',
      extra: rows([['Espresso', '2€'], ['Freddo espresso', '2.40€'], ['Cappuccino', '2.60€']]) }) },
  {
    id: 'shop-carousel-1',
    html: () => series({ ground: 'black', tag: 'Συρε →', say: 'Ρόδου 68.<br><em>Πάμε μια βόλτα.</em>', cls: 'sm' }),
    caption: {
      el: 'Ρόδου 68, πάμε μια βόλτα. Σύρε, και μετά πέρνα από κοντά: κάθε μέρα 07:00 – 22:00.',
      en: 'Rodou 68, a quick tour. Swipe, then come see it in person: every day 07:00 – 22:00.',
    },
  },
  { id: 'shop-carousel-2', bare: 'beans-hopper', fixed: true },
  { id: 'shop-carousel-3', bare: 'drip-close', fixed: true },
  { id: 'shop-carousel-4', html: () => series({ ground: 'gold', tag: '07:00', say: 'Τα λέμε<br><em>από κοντά.</em>',
      sub: 'Ρόδου 68, Κάτω Πατήσια. Κάθε μέρα 07:00 – 22:00.' }) },
  {
    id: 'vitrine-carousel-1',
    html: () => pro({ img: 'vitrine-tall', kicker: 'Συρε →', h1: 'Τι έχει<br><em>η βιτρίνα.</em>', sm: true }),
    caption: {
      el: 'Τι έχει η βιτρίνα: πεϊνιρλί 2.80€, κρουασάν 2.50€, μπουγάτσα κρέμα 2.80€, τυρόπιτα 1.60€, σπανακόπιτα 2.50€, πίτσα 2.80€. Εσύ τι παίρνεις;',
      en: "What's in the window: peinirli €2.80, croissant €2.50, cream bougatsa €2.80, cheese pie €1.60, spinach pie €2.50, pizza €2.80. What are you having?",
    },
  },
  { id: 'vitrine-carousel-2', bare: 'pie-macro', fixed: true },
  { id: 'vitrine-carousel-3', bare: 'bread-sesame', fixed: true },
  { id: 'vitrine-carousel-4', bare: 'snack-plate', fixed: true },
  { id: 'vitrine-carousel-5', html: () => series({ ground: 'black', tag: 'Στο μενού · Βιτρίνα', cls: 'sm', say: 'Εσύ τι<br><em>παίρνεις;</em>',
      extra: rows([['Πεϊνιρλί', '2.80€'], ['Κρουασάν', '2.50€'], ['Μπουγάτσα κρέμα', '2.80€'], ['Τυρόπιτα', '1.60€'], ['Σπανακόπιτα', '2.50€'], ['Πίτσα', '2.80€']]) }) },
  {
    id: 'team-carousel-1',
    html: () => pro({ img: 'staff-profile', kicker: 'Συρε →', h1: 'Πίσω από<br><em>τον πάγκο.</em>', sm: true }),
    caption: {
      el: 'Πίσω από τον πάγκο στο Blessed, από τον πρώτο espresso ως το τελευταίο ποτήρι. Σύρε. Κάθε μέρα 07:00 – 22:00.',
      en: 'Behind the counter at Blessed, from the first espresso to the last cup. Swipe. Every day 07:00 – 22:00.',
    },
  },
  { id: 'team-carousel-2', bare: 'staff-wide', fixed: true },
  { id: 'team-carousel-3', bare: 'apron-blur', fixed: true },
  { id: 'team-carousel-4', html: () => series({ ground: 'cream', tag: 'Είπατε · ★★★★★', cls: 'q',
      say: '«Τα παιδιά είναι <em>καταπληκτικά.</em>»', sub: 'Ninaki Euangelou, Google Maps' }) },
];

const TAGS =
  '#blessedcoffee #katopatisia #athenscoffee #specialtycoffee #coffeeathens #πατησια #καφεσ #athens';

// ─── RENDER ──────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const posts = only.length ? POSTS.filter((p) => only.includes(p.id)) : POSTS;
if (!posts.length) {
  console.error(`No matching posts. Available: ${POSTS.map((p) => p.id).join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

// Bare posts: the shot itself under the mark and footer. IG takes 4:5 up to 1.91:1, so portrait shots
// are trimmed to 4:5 and landscape ones keep their shape (signage never gets cut). Carousel slides
// (fixed) are always 4:5. keep: the top share of the shot to keep, to drop a sign the photographer's
// frame cuts at the bottom. Cropped at 2x here, then carded in the browser like every other post.
const bare = posts.filter((p) => p.bare);
const bareH = bare.length ? JSON.parse(execFileSync('python3', ['-c', `
import sys, json
from PIL import Image, ImageOps
sizes = {}
for arg in sys.argv[1:]:
    src, out, fixed, keep = arg.split('|')
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    im = im.crop((0, 0, im.size[0], round(im.size[1] * float(keep))))
    w, h = im.size
    lo, hi = 0.8, (0.8 if fixed == '1' else 1.91)
    r = min(max(w / h, lo), hi)
    if w / h > r: cw = round(h * r); im = im.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h))
    elif w / h < r: ch = round(w / r); im = im.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch))
    h = round(${W} * im.size[1] / im.size[0])
    im.resize((${W * SCALE}, h * ${SCALE}), Image.LANCZOS).save(out, 'JPEG', quality=95)
    sizes[out.split('/')[-1][5:-4]] = h
print(json.dumps(sizes))
`, ...bare.map((p) => `${ROOT}/social/photos/shoot/${p.bare}.jpg|${TMP}/bare-${p.id}.jpg|${p.fixed ? 1 : 0}|${p.keep || 1}`)]).toString()) : {};
// Every feed post is 4:5 (IG crops and shrinks landscape). A landscape shot sits full width, uncropped,
// across the middle, on a blurred dark copy of itself, so signage stays whole.
const bareCard = (id, h) => {
  const src = dataUri(TMP, `bare-${id}.jpg`);
  return h >= H ? shell(`<img class="fill" src="${src}"><div class="fade bare"></div><img class="mark" src="${logo}"><div class="body"></div>`, null, false, 'bare')
    : shell(`<img class="fill blurfill" src="${src}"><img class="mid" src="${src}" style="top:${Math.round((H - h * 0.9) / 2)}px">
      <div class="fade bare"></div><img class="mark" src="${logo}"><div class="body"></div>`, null, false, 'bare');
};

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: SCALE,
});

for (const post of posts) {
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<style>${CSS}</style>${post.bare ? bareCard(post.id, bareH[post.id]) : post.html(post.bg, post.real)}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready); // webfonts, or the type renders as fallback
  await page.screenshot({ path: `${TMP}/${post.id}.png` });
  // Carousel slides after the first carry no caption: the cover's .txt covers the whole set.
  if (post.caption) writeFileSync(`${OUT}/${post.id}.txt`, `${post.caption.el}\n\n${post.caption.en}\n\n${TAGS}\n`);
  console.log(`rendered ${post.id}`);
}

await browser.close();

// Supersample 2x -> 1x. LANCZOS is what keeps 25px letterspaced type legible.
execFileSync('python3', [
  '-c',
  `
import sys, glob, os
from PIL import Image
for src in glob.glob(sys.argv[1] + '/*.png'):
    out = os.path.join(sys.argv[2], os.path.splitext(os.path.basename(src))[0] + '.jpg')
    im = Image.open(src).convert('RGB')
    im = im.resize((${W}, round(${W} * im.size[1] / im.size[0])), Image.LANCZOS)
    im.save(out, 'JPEG', quality=92, optimize=True, progressive=True)
    print('  ->', os.path.basename(out), im.size)
`,
  TMP,
  OUT,
], { stdio: 'inherit' });

rmSync(TMP, { recursive: true, force: true });
console.log(`\n${posts.length} post(s) in social/library/`);
