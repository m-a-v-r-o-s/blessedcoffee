// Renders the Blessed Coffee social content library.
//   node social/render.mjs            all posts
//   node social/render.mjs hours early only these ids
//
// Every fact below is copied from src/App.jsx or the live site. Nothing here is
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
`;

const shell = (inner, bg, real, cls = '') => `<div class="card ${cls}">
  ${bg ? `<div class="bg${real ? ' real' : ''}"><img src="${bg}"></div>` : ''}
  ${inner}
  <div class="foot"><span>${BRAND.address}</span><span>${BRAND.site}</span></div>
</div>`;

// Series card. ground: gold (07:00), cream (Είπατε, reviews), black (Στο μενού, Ζητείται).
const rows = (items) => `<div class="rows">${items.map(([k, v]) =>
  `<div class="row"><span class="k">${k}</span><span class="dots"></span><span class="v">${v}</span></div>`).join('')}</div>`;
// Photographer shots land in social/photos/shoot/<id>.jpg; until then the card renders text-only.
const shoot = (id) => existsSync(`${ROOT}/social/photos/shoot/${id}.jpg`) ? dataUri(`${ROOT}/social/photos/shoot`, `${id}.jpg`) : null;
const series = ({ ground, tag, say, cls = '', sub = '', extra = '', img = null }) =>
  shell(`${img ? `<img class="fill" src="${img}"><div class="fade both"></div>` : ''}<div class="stop"><img class="mark" src="${logo}"><span class="tag">${tag}</span></div>
  <div class="say ${cls}">${say}</div>
  <div class="tail">${extra}${sub ? `<div class="sub">${sub}</div>` : ''}</div>`, null, false, `s s-${ground}${img ? ' photo' : ''}" lang="el`);

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
      extra: rows([['Μπουγάτσα κρέμα', '2.80€'], ['Freddo espresso', '2.30€']]) }),
    caption: {
      el: `Μπουγάτσα κρέμα 2.80€ και freddo espresso 2.30€. Το πρωινό, λυμένο. Από τις 07:00. ${TAG_US.el}`,
      en: `Cream bougatsa €2.80 and a freddo espresso €2.30. Breakfast, sorted. From 7am. ${TAG_US.en}`,
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
      extra: rows([['Freddo espresso', '2.30€'], ['Freddo cappuccino', '2.60€']]),
      sub: 'Με πολύ πάγο, από τις 07:00.' }),
    caption: {
      el: `Καύσωνας; Freddo. Freddo espresso 2.30€, freddo cappuccino 2.60€, με πολύ πάγο. Ρόδου 68, κάθε μέρα από τις 07:00. ${TAG_US.el}`,
      en: `Heatwave? Freddo. Freddo espresso €2.30, freddo cappuccino €2.60, plenty of ice. Rodou 68, every day from 7am. ${TAG_US.en}`,
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
    html: () => series({ ground: 'winter', tag: 'Χειμώνας · №01', img: shoot('winter-espresso'),
      say: 'Κρύο έξω.<br><em>Espresso</em><br>μέσα.',
      extra: rows([['Espresso', '1.80€']]),
      sub: 'Ζεστός, από τις 07:00.' }),
    caption: {
      el: `Κρύο έξω, espresso μέσα. Espresso 1.80€, κάθε μέρα από τις 07:00, Ρόδου 68. ${TAG_US.el}`,
      en: `Cold outside, espresso inside. Espresso €1.80, every day from 7am, Rodou 68. ${TAG_US.en}`,
    },
  },
  {
    id: 'winter-cappuccino',
    html: () => series({ ground: 'winter', tag: 'Χειμώνας · №02', img: shoot('winter-cappuccino'),
      say: 'Cappuccino.<br><em>Για τα κρύα<br>πρωινά.</em>',
      extra: rows([['Cappuccino', '2.60€']]),
      sub: 'Πάρ\' τον μαζί σου, ζεσταίνει και τα χέρια.' }),
    caption: {
      el: `Cappuccino 2.60€, για τα κρύα πρωινά. Πάρ' τον μαζί σου, ζεσταίνει και τα χέρια. Από τις 07:00. ${TAG_US.el}`,
      en: `Cappuccino €2.60, for the cold mornings. Take it with you, it warms your hands too. From 7am. ${TAG_US.en}`,
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
      say: 'Espresso.<br><em>1.80€.</em>',
      extra: rows([['Freddo espresso', '2.30€'], ['Freddo cappuccino', '2.60€']]),
      sub: 'Αυτό. Δεν έχουμε κάτι άλλο να πούμε.' }),
    caption: {
      el: 'Espresso 1.80€. Freddo espresso 2.30€. Freddo cappuccino 2.60€. Στα Κάτω Πατήσια, κάθε μέρα από τις 07:00.',
      en: 'Espresso €1.80. Freddo espresso €2.30. Freddo cappuccino €2.60. Kato Patisia, every day from 7am.',
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
    id: 'hiring',
    html: () => series({ ground: 'black', tag: 'Ζητείται',
      say: 'Ψάχνουμε<br><em>barista.</em>',
      sub: 'Με πάθος για τον specialty καφέ. Πλήρης ή μερική απασχόληση.' }),
    caption: {
      el: 'Ψάχνουμε barista με πάθος για τον specialty καφέ. Πλήρης ή μερική απασχόληση. Στείλε μας μήνυμα ή πέρασε από το μαγαζί.',
      en: 'We are looking for a barista with specialty coffee experience. Full or part-time. DM us or drop by.',
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
      extra: rows([['Τυρόπιτα Κουρού', '2.50€'], ['Ζαμπονοτυρόπιτα', '2.80€'], ['Λουκανικόπιτα', '2.50€'], ['Σπανακόπιτα με Τυρί', '2.50€']]) }),
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
  // ─── Neighbourhood atmosphere. Plain until the photographer's shots replace them. ──
  {
    id: 'atmosphere-neighbourhood',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Γειτονια</div>
        <h1 class="sm">Κάτω<br><em>Πατήσια.</em></h1>
        <div class="rule"></div>
        <div class="lede">Η γειτονιά μας, πριν ανοίξουμε.</div>
      </div>`, bg, real),
    caption: {
      el: 'Η γειτονιά μας, πριν ανοίξουμε. Κάτω Πατήσια.',
      en: 'Our neighbourhood, before we open. Kato Patisia.',
    },
  },
  {
    id: 'atmosphere-early',
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
  // ─── Hiring, second role. ─────────────────────────────────────────────────────
  {
    id: 'hiring-driver',
    html: () => series({ ground: 'black', tag: 'Ζητείται',
      say: 'Ψάχνουμε<br><em>διανομέα.</em>',
      sub: 'Για πρωινές και βραδινές βάρδιες. Ευέλικτο ωράριο.' }),
    caption: {
      el: 'Ψάχνουμε υπεύθυνο διανομέα για πρωινές και βραδινές βάρδιες, με ευέλικτο ωράριο. Στείλε μας μήνυμα ή πέρασε από το μαγαζί.',
      en: 'Looking for a reliable delivery driver, morning and evening shifts, flexible hours. DM us or drop by.',
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
        <div class="lede">Κάθε φλιτζάνι, φτιαγμένο στο χέρι.</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-34-43.png'),
    real: true,
    caption: {
      el: 'Κάθε φλιτζάνι, φτιαγμένο στο χέρι, με προσοχή.',
      en: 'Every cup, made by hand, with care.',
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
        <h1 class="sm">Με το<br><em>χέρι.</em></h1>
        <div class="rule"></div>
        <div class="lede">Όχι κουμπί, όχι μηχανή που αποφασίζει.</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-36-24.png'),
    real: true,
    caption: {
      el: 'Με το χέρι, κάθε παραγγελία. Όχι κουμπί που αποφασίζει μόνο του.',
      en: 'By hand, every order. Not a button deciding on its own.',
    },
  },
  // ─── Cocktails: real photos, no name/price on file yet, so the copy stays honest and vague. ──
  {
    id: 'cocktail-teaser',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker" style="color:${BRAND.ink}">Και κοκτειλ</div>
        <h1>Δεν είμαστε<br><em>μόνο καφές.</em></h1>
        <div class="rule"></div>
        <div class="lede">Κοκτέιλ, φτιαγμένα εδώ, στο μαγαζί.</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-37-08.png'),
    real: true,
    caption: {
      el: 'Δεν είμαστε μόνο καφές. Κοκτέιλ, φτιαγμένα εδώ, στο μαγαζί.',
      en: "We're not just coffee. Cocktails, made right here.",
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
      <div class="body tight">
        <div class="kicker">Πρωτοχρονια</div>
        <h1 class="sm">Καλή<br><em>Χρονιά.</em></h1>
        <div class="rule"></div>
        <div class="lede">Ευχές από όλους εμάς στο Blessed.</div>
      </div>`, bg, real),
    caption: {
      el: 'Καλή χρονιά από όλους εμάς στο Blessed. Ό,τι καλύτερο για σένα και τους δικούς σου.',
      en: 'Happy New Year from everyone at Blessed. All the best to you and yours.',
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
    caption: {
      el: 'Καλό καλοκαίρι από όλους εμάς στο Blessed, σε όλη τη γειτονιά.',
      en: 'Happy summer from everyone at Blessed, to the whole neighbourhood.',
    },
  },
  {
    id: 'apokries',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Αποκριες</div>
        <h1 class="sm">Καλές<br><em>Απόκριες.</em></h1>
        <div class="rule"></div>
        <div class="lede">Με κέφι, στη γειτονιά μας.</div>
      </div>`, bg, real),
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
      shell(`<img class="shot" src="${shot('hero-low')}" style="width:1170px;left:250px;top:-70px">
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
      shell(`<img class="shot" src="${shot('lid-top')}" style="width:1000px;left:40px;top:10px">
      <svg class="shot" viewBox="0 0 1000 1000" style="width:1000px;left:40px;top:10px">
        <defs><path id="ring" d="M500,500 m-405,0 a405,405 0 1,1 810,0 a405,405 0 1,1 -810,0"/></defs>
        <text font-family="Barlow Semi Condensed" font-weight="600" font-size="30" fill="${BRAND.gold}">
          <textPath href="#ring" textLength="2500" lengthAdjust="spacing">ΡΟΔΟΥ 68 · ΚΑΤΩ ΠΑΤΗΣΙΑ · ΚΑΘΕ ΜΕΡΑ 07:00 – 22:00 · BLESSED.CAFE ·</textPath>
        </text>
      </svg>
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
      shell(`<img class="shot" src="${shot('front')}" style="width:940px;left:420px;top:40px">
      <img class="mark" src="${logo}">
      <div class="body tight" style="max-width:560px">
        <div class="kicker">Ζεστος καφες</div>
        <div class="rows" style="gap:14px;margin-top:10px">
          <div class="row"><span class="k">Espresso</span><span class="dots"></span><span class="v">1.80€</span></div>
          <div class="row"><span class="k">Americano</span><span class="dots"></span><span class="v">2€</span></div>
          <div class="row"><span class="k">Macchiato</span><span class="dots"></span><span class="v">2.10€</span></div>
          <div class="row"><span class="k">Cappuccino</span><span class="dots"></span><span class="v">2.60€</span></div>
          <div class="row"><span class="k">Capp. Latte</span><span class="dots"></span><span class="v">2.60€</span></div>
        </div>
        <div class="rule" style="margin-top:14px"></div>
        <div class="el">Σε ποτήρι που κρατάει ζεστό τον δρόμο.</div>
      </div>`, null, false, 'cupground'),
    caption: {
      el: 'Espresso 1.80€, americano 2€, macchiato 2.10€, cappuccino 2.60€, cappuccino latte 2.60€. Στη Ρόδου 68, κάθε μέρα από τις 07:00.',
      en: 'Espresso €1.80, americano €2, macchiato €2.10, cappuccino €2.60, cappuccino latte €2.60. Rodou 68, every day from 7am.',
    },
  },
  // Carousel: cover, one slide per label panel, then where and when. Publish as one post, in order.
  {
    id: 'cup-carousel-1',
    html: () =>
      shell(`<img class="shot" src="${shot('hero-34')}" style="width:1030px;left:120px;top:10px">
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
      <div class="body tight">
        <div class="idx">03 / 03</div>
        <h1 class="sm">Mrs Rose<br><em>Caffè.</em></h1>
        <div class="lede">Ο συνεργάτης μας στον καφέ.</div>
      </div>`, null, false, 'cupground'),
  },
  {
    id: 'cup-carousel-5',
    html: () =>
      shell(`<img class="shot" src="${shot('front')}" style="width:760px;left:160px;top:-10px">
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
        <div class="cols" style="margin-top:18px"><span>MRS ROSE</span><span>DOLCE</span></div>
        <div class="rows menu">
          ${[['Freddo Espresso', '2.30€', '2.20€'], ['Freddo Cappuccino', '2.60€', '2.50€'], ['Cappuccino Latte', '2.60€', '2.50€'],
             ['Cappuccino', '2.60€', '2.50€'], ['Espresso', '1.80€', '1.70€'], ['Macchiato', '2.10€', '2.10€'], ['Frappé', '1.80€', '–'],
             ['NES', '1.80€', '–'], ['Φίλτρου', '2€', '–'], ['Ελληνικός', '1.80€', '–'], ['Americano', '2€', '–']]
            .map(([k, a, b]) => `<div class="row"><span class="k">${k}</span><span class="dots"></span><span class="v">${a}</span><span class="v">${b}</span></div>`).join('')}
        </div>
      </div>`),
    caption: {
      el: 'Όλος ο καφές μας, Mrs Rose και Dolce. Από espresso 1.70€ μέχρι freddo cappuccino 2.60€. Ρόδου 68, κάθε μέρα 07:00 – 22:00.',
      en: 'Our whole coffee menu, Mrs Rose and Dolce. From espresso at €1.70 to freddo cappuccino at €2.60. Rodou 68, every day 07:00 – 22:00.',
    },
  },
  {
    id: 'stamp-machine',
    html: (bg, real) =>
      shell(`<div class="fade"></div><img class="corner" src="${stamp}">
      <img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Απο τη μηχανη</div>
        <h1 class="sm">Κατευθείαν<br><em>στο χέρι σου.</em></h1>
        <div class="rule"></div>
        <div class="lede">Espresso 1.80€, για εδώ ή για το δρόμο.</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-35-16.png'),
    real: true,
    caption: {
      el: 'Από τη μηχανή, κατευθείαν στο χέρι σου. Espresso 1.80€, για εδώ ή για το δρόμο.',
      en: 'Straight from the machine into your hand. Espresso €1.80, for here or to go.',
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
  {
    id: 'stamp-cocktails',
    html: (bg, real) =>
      shell(`<img class="corner" src="${stamp}">
      <img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker" style="color:${BRAND.ink}">Cocktails · 6€</div>
        <h1 class="sm">Και μετά<br><em>τον καφέ.</em></h1>
        <div class="rule"></div>
        <div class="lede" style="max-width:none">Zombie · Daiquiri · Pornstar<br>Mojito · Cucumber Basil · Bubble Blessed</div>
      </div>`, bg, real),
    bg: photo('Screenshot_2026-09-20_21-37-01.png'),
    real: true,
    caption: {
      el: 'Και μετά τον καφέ: Zombie, Daiquiri, Pornstar, Mojito, Cucumber Basil, Bubble Blessed. Όλα 6€.',
      en: 'And after the coffee: Zombie, Daiquiri, Pornstar, Mojito, Cucumber Basil, Bubble Blessed. All €6.',
    },
  },
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

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: SCALE,
});

for (const post of posts) {
  await page.setContent(`<style>${CSS}</style>${post.html(post.bg, post.real)}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready); // webfonts, or the type renders as fallback
  await page.screenshot({ path: `${TMP}/${post.id}.png` });
  // Carousel slides after the first carry no caption: the cover's .txt covers the whole set.
  if (post.caption) writeFileSync(
    `${OUT}/${post.id}.txt`,
    `${post.caption.el}\n\n${post.caption.en}\n\n${TAGS}\n`
  );
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
    im = Image.open(src).convert('RGB').resize((${W}, ${H}), Image.LANCZOS)
    im.save(out, 'JPEG', quality=92, optimize=True, progressive=True)
    print('  ->', os.path.basename(out), im.size)
`,
  TMP,
  OUT,
], { stdio: 'inherit' });

rmSync(TMP, { recursive: true, force: true });
console.log(`\n${posts.length} post(s) in social/library/`);
