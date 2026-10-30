// Renders Blessed Coffee IG/FB Stories (1080x1920, 9:16).
//   node social/render-stories.mjs            all stories
//   node social/render-stories.mjs open-hours only these ids
//
// Separate from render.mjs on purpose: feed cards are 1080x1350 and this is a
// different canvas/shell. Same technical pattern (playwright-core screenshot,
// PIL downsample), same BRAND tokens, same no-invented-facts rule.
//
// Cadence is 2 stories/day/platform (~730/year), so this file is templates, not
// one-off designs: a handful of parameterized functions, called with different
// strings. Every fact passed in traces to social/render.mjs's own POSTS array
// (hours, prices, delivery partners), which is itself sourced from src/App.jsx.

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = `${ROOT}/social/library-stories`;
const TMP = `${ROOT}/social/.render-stories-tmp`;

const CHROME =
  process.env.CHROME_PATH ||
  '/home/akos/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';

const W = 1080;
const H = 1920; // IG/FB Story: 9:16 portrait.
const SCALE = 2;

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
// Reuse the 1080x1350 feed cards already rendered by render.mjs, so recycling
// old content costs zero new art direction.
const feedCard = (f) => dataUri(`${ROOT}/social/library`, f);
const asset = (f) => dataUri(`${ROOT}/public`, f);
const photo = (f) => dataUri(`${ROOT}/social/photos`, f);
// The 3D cup: posed stills rendered on demand by cup/shots.mjs, plus the cutout sticker.
const CUP = `${ROOT}/social/cup`;
const shot = (name) => {
  if (!existsSync(`${CUP}/shots/${name}.png`)) execFileSync('node', [`${CUP}/shots.mjs`, name], { stdio: 'inherit' });
  return dataUri(`${CUP}/shots`, `${name}.png`);
};
const sticker = dataUri(CUP, 'cup-watermark.png');
// A shoot photo as the room around the 3D cup (no signage shots, so nothing branded gets cut).
const backdrop = (img) => `<img class="backdrop" src="${photo(`shoot/${img}.jpg`)}"><div class="backshade"></div>`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Barlow+Semi+Condensed:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px; overflow: hidden;
    background: ${BRAND.ground}; color: ${BRAND.ink};
    font-family: 'Barlow Semi Condensed', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  /* Taller than the feed card, so content sits centered in the safe middle
     third: IG/FB overlay their own UI chrome on the top and bottom of a Story. */
  .card {
    position: relative; width: 100%; height: 100%;
    display: flex; flex-direction: column; justify-content: center;
    padding: 260px 84px;
    background: linear-gradient(168deg, #151210 0%, ${BRAND.ground} 58%, #060606 100%);
  }
  .mark { width: 150px; filter: invert(1); opacity: .94; margin: 0 auto 48px; display: block; }
  .kicker {
    font-size: 30px; font-weight: 600; letter-spacing: .34em; text-transform: uppercase;
    color: ${BRAND.gold}; text-align: center;
  }
  h1 {
    font-family: 'Playfair Display', serif; font-weight: 600;
    font-size: 104px; line-height: 1.02; letter-spacing: -.015em; text-align: center;
    margin-top: 34px;
  }
  h1 em { font-style: italic; color: ${BRAND.gold}; }
  .lede {
    font-size: 40px; font-weight: 300; line-height: 1.4; color: #CFC6BC;
    text-align: center; margin: 0 auto; max-width: 22ch; margin-top: 30px;
  }
  .rule { width: 132px; height: 3px; background: ${BRAND.gold}; margin: 36px auto 0; }
  .rows { display: flex; flex-direction: column; gap: 26px; margin-top: 44px; }
  .row { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; }
  .row .k { font-size: 42px; font-weight: 500; letter-spacing: .01em; }
  .row .v { font-family: 'Playfair Display', serif; font-size: 48px; color: ${BRAND.gold}; white-space: nowrap; }
  .row .dots { flex: 1; border-bottom: 2px dotted #3A322C; transform: translateY(-10px); }
  .big-price {
    font-family: 'Playfair Display', serif; font-size: 220px; line-height: .85;
    color: ${BRAND.gold}; text-align: center; margin-top: 20px;
  }
  .big-price small { font-size: 76px; }
  .partners { display: flex; align-items: center; justify-content: center; gap: 28px; margin-top: 50px; }
  .partners span {
    width: 156px; height: 156px; border-radius: 32px; background: ${BRAND.ink};
    display: flex; align-items: center; justify-content: center; padding: 22px;
  }
  .partners img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .foot {
    position: absolute; left: 84px; right: 84px; bottom: 90px;
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 26px; border-top: 1px solid #2A2422;
    font-size: 24px; font-weight: 500; letter-spacing: .2em; color: #6E645C;
  }
  /* Reformat shell: an existing 1080x1350 feed card, letterboxed into 9:16 with
     brand-colour bars top and bottom instead of a crop, so nothing gets cut. */
  .reformat { position: relative; width: 100%; height: 100%; background: ${BRAND.ground}; }
  .reformat .bar {
    position: absolute; left: 0; right: 0; height: 285px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(168deg, #151210 0%, ${BRAND.ground} 100%);
  }
  .reformat .bar.top { top: 0; border-bottom: 2px solid ${BRAND.gold}; }
  .reformat .bar.bottom { bottom: 0; border-top: 2px solid ${BRAND.gold}; }
  .reformat .bar .site { font-size: 26px; font-weight: 600; letter-spacing: .3em; color: ${BRAND.muted}; }
  .reformat .photo { position: absolute; top: 285px; left: 0; width: 1080px; height: 1350px; }
  .reformat .photo img { width: 100%; height: 100%; object-fit: cover; }
  /* ─── 3D cup stories ─── */
  .card.cupground { background: linear-gradient(180deg, #1B1611 0%, #110E0B 50%, #070707 100%); justify-content: flex-end; padding-bottom: 360px; }
  .card > .shot { position: absolute; z-index: 0; }
  .card > .fill { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
  .card > .fade { position: absolute; inset: 0; z-index: 0;
    background: linear-gradient(180deg, rgba(8,8,8,.1) 0%, rgba(8,8,8,0) 30%, rgba(8,8,8,.85) 58%, rgba(6,6,6,.97) 80%); }
  .card > .over { position: relative; z-index: 1; }
  /* Shop photo behind a 3D cup: blurred and darkened so the cup reads, dark at the bottom for type. */
  .card > .backdrop { position: absolute; left: -40px; top: -40px; width: calc(100% + 80px); height: calc(100% + 80px);
    object-fit: cover; filter: blur(14px) brightness(.48) saturate(.95); z-index: 0; }
  .card > .backshade { position: absolute; inset: 0; z-index: 0;
    background: linear-gradient(180deg, rgba(8,8,8,.4) 0%, rgba(8,8,8,.08) 25%, rgba(8,8,8,.15) 50%, rgba(6,6,6,.85) 72%, rgba(6,6,6,.96) 100%); }
  .card > .mark, .card > h1, .card > .kicker, .card > .thumbs { position: relative; z-index: 1; }
  .card > .foot { z-index: 1; }
  .card > .sticker { position: absolute; z-index: 1;
    filter: drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 24px 28px rgba(0,0,0,.55)); }
  /* Photo story: a real shop photo full-bleed, type low in the safe zone. Stories may reuse
     the same photo with different lines; feed posts may not. */
  .card.ph { justify-content: flex-end; padding-bottom: 330px; }
  .card.ph > .fill { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
  .card.ph > .shade { position: absolute; inset: 0; z-index: 0;
    background: linear-gradient(180deg, rgba(8,8,8,.55) 0%, rgba(8,8,8,0) 16%, rgba(8,8,8,0) 40%, rgba(6,6,6,.7) 58%, rgba(6,6,6,.94) 78%); }
  .card.ph > .mark { position: absolute; top: 250px; left: 0; right: 0; z-index: 1; margin: 0 auto; }
  .card.ph > .over, .card.ph > .foot { z-index: 1; }
  .card.ph h1 { font-size: 92px; }
  .card.ph > .plate { position: absolute; left: 0; top: 440px; width: 100%; z-index: 0; object-fit: cover; object-position: 50% 0; }
  .card.ph .lede { color: #E4DCD2; }
  /* Text under the mark instead of low, for shots with a logo in the bottom half. */
  .card.ph.top { justify-content: flex-start; padding-top: 450px; }
  .card.ph.top > .shade { background: linear-gradient(180deg, rgba(8,8,8,.92) 0%, rgba(8,8,8,.8) 30%, rgba(8,8,8,0) 50%, rgba(8,8,8,0) 82%, rgba(6,6,6,.85) 100%); }
  .card.ph .kicker, .card.ph h1, .card.ph .lede { text-shadow: 0 1px 14px rgba(0,0,0,.7); }
  /* Summer ground: pale ice-blue, dark type. */
  .card.summer { background: #D7E6E8; color: #0A0A0A; }
  .card.summer .mark { filter: none; }
  .card.summer .kicker, .card.summer h1 em { color: #8A6414; }
  .card.summer .lede, .card.summer .foot { color: #4F5F63; border-color: #B5C8CB; }
  .thumbs { display: flex; justify-content: center; gap: 12px; margin-top: 56px; }
  .thumbs figure { width: 300px; text-align: center; }
  .thumbs img { width: 300px; display: block; }
  .thumbs figcaption { margin-top: 10px; font-size: 30px; font-weight: 600; letter-spacing: .12em; color: ${BRAND.gold}; }
  .thumbs figcaption b { display: block; font-family: 'Playfair Display', serif; font-size: 64px; color: ${BRAND.ink}; font-weight: 600; letter-spacing: 0; }
`;

const foot = () => `<div class="foot"><span>${BRAND.address}</span><span>${BRAND.site}</span></div>`;

// ─── TEMPLATES ────────────────────────────────────────────────────────────
// Each one is a plain function: fixed layout, a few strings/values in. Keeping
// them this narrow is what makes 2/day sustainable without a designer pass.

// 1. Hours reminder. Facts: src/App.jsx MENU_DATA hours, already used verbatim
//    in render.mjs's "hours" post.
const hoursStory = ({ note = 'Κάθε μέρα, από νωρίς. / Open early, every day.' } = {}) => `<div class="card">
  <img class="mark" src="${logo}">
  <div class="kicker">Ωραριο / Hours</div>
  <div class="rows">
    <div class="row"><span class="k">ΚΑΘΕ ΜΕΡΑ</span><span class="dots"></span><span class="v">07:00 – 22:00</span></div>
  </div>
  <div class="lede" style="margin-top:36px">${note}</div>
  ${foot()}
</div>`;

// 2. Plain text announcement. kicker + headline (may contain <em> for the gold
//    word) + lede are the only inputs, so this covers any short honest claim
//    already established elsewhere (a day-of-week note, a reminder, a greeting).
const textAnnouncementStory = ({ kicker, headline, lede }) => `<div class="card">
  <img class="mark" src="${logo}">
  <div class="kicker">${kicker}</div>
  <h1>${headline}</h1>
  ${lede ? `<div class="rule"></div><div class="lede">${lede}</div>` : ''}
  ${foot()}
</div>`;

// 3. Delivery / order-now reminder. Partner logos + lede, same three delivery
//    tiles as render.mjs's "delivery" post (e-food, Wolt, Box).
const deliveryStory = ({ lede = 'e-food, Wolt και Box. Ο καφές σου, στην πόρτα σου.' } = {}) => `<div class="card">
  <img class="mark" src="${logo}">
  <div class="kicker">Delivery</div>
  <h1 style="font-size:88px">Φέρνουμε<br>τον καφέ<br><em>σε σένα.</em></h1>
  <div class="partners">
    <span><img src="${asset('efood-logo.webp')}"></span>
    <span><img src="${asset('wolt-logo.webp')}"></span>
    <span><img src="${asset('box-logo.png')}"></span>
  </div>
  <div class="lede" style="margin-top:36px">${lede}</div>
  ${foot()}
</div>`;

// 4. Price highlight. kicker + price + note, same shape as render.mjs's
//    "espresso-price" card, generalised to any single MENU line.
const priceStory = ({ kicker, price, note }) => `<div class="card">
  <img class="mark" src="${logo}">
  <div class="kicker">${kicker}</div>
  <div class="big-price">${price}<small>€</small></div>
  ${note ? `<div class="rule"></div><div class="lede">${note}</div>` : ''}
  ${foot()}
</div>`;

// 5. Feed-card reformat. Crops nothing: the existing 1080x1350 jpg drops in at
//    native size with brand-colour letterbox bars top/bottom, so 23 existing
//    posts become free Story content with zero new art direction. No logo in
//    the bars: every feed card already carries its own mark near its top edge,
//    so a second one in the bar just doubles up.
// 6. Photo story. Any real shop photo, any honest line: the photo can repeat across stories.
// pos 'plate' shows the shot full-width under the mark instead of cropping its sides, so signage never gets
// cut; 'plate:<ratio>' also trims the bottom to that ratio (drops a sign the photographer's frame cuts).
// at 'top' puts the type under the mark, for shots with a logo low in the frame.
const photoStory = ({ img, kicker, headline, lede = '', pos = 'center', at = 'bottom' }) => `<div class="card ph${at === 'top' ? ' top' : ''}">
  ${pos.startsWith('plate') ? `<img class="plate" src="${photo(img)}" style="aspect-ratio:${pos.split(':')[1] || 'auto'}">`
    : `<img class="fill" src="${photo(img)}" style="object-position:${pos}">`}<div class="shade"></div>
  <img class="mark" src="${logo}">
  <div class="over">
    <div class="kicker">${kicker}</div>
    <h1>${headline}</h1>
    ${lede ? `<div class="lede">${lede}</div>` : ''}
  </div>
  ${foot()}
</div>`;

const reformatStory = (file) => `<div class="reformat">
  <div class="bar top"><span class="site">${BRAND.site}</span></div>
  <div class="photo"><img src="${feedCard(file)}"></div>
  <div class="bar bottom"><span class="site">${BRAND.address}</span></div>
</div>`;

// ─── STORIES ─────────────────────────────────────────────────────────────
// Example renders using only already-vetted facts/assets. No caption .txt: IG
// and FB Stories carry no separate caption field, the text lives on the image.
const STORIES = [
  { id: 'open-hours', html: () => hoursStory() },
  {
    id: 'sunday-open',
    html: () =>
      textAnnouncementStory({
        kicker: 'Κυριακή',
        headline: 'Ανοιχτά<br>και <em>Κυριακή.</em>',
        lede: '07:00 – 22:00.',
      }),
  },
  { id: 'order-delivery', html: () => deliveryStory() },
  {
    id: 'espresso-price',
    html: () =>
      priceStory({
        kicker: 'Espresso',
        price: '2.00',
        note: 'Freddo espresso 2.40€<br>Cappuccino 2.60€<br>Freddo cappuccino 2.60€',
      }),
  },
  { id: 'reformat-review-martha', html: () => reformatStory('review-martha.jpg') },
  { id: 'reformat-tagline', html: () => reformatStory('tagline.jpg') },
  // ─── The 3D cup (social/cup/). Text stays between y=250 and y=1580, clear of IG's chrome. ──
  {
    id: 'story-cup-today',
    html: () => `<div class="card cupground">
      ${backdrop('interior')}
      <img class="shot" src="${shot('hero-low')}" style="width:1000px;left:40px;top:20px">
      <div class="over">
        <div class="kicker">Σημερα / Today</div>
        <h1>Ανοιχτά<br><em>07:00 – 22:00.</em></h1>
        <div class="lede">Κάθε μέρα. Ρόδου 68.</div>
      </div>
      ${foot()}
    </div>`,
  },
  {
    id: 'story-poll-side',
    html: () => `<div class="card">
      ${backdrop('slat-wall')}
      <div class="kicker">Ψηφισε / Vote</div>
      <h1 style="font-size:96px">Από ποια πλευρά<br><em>πίνεις;</em></h1>
      <div class="thumbs">
        <figure><img src="${shot('thumb-logo')}"><figcaption><b>A</b>ΤΟ ΣΗΜΑ</figcaption></figure>
        <figure><img src="${shot('thumb-slogan')}"><figcaption><b>B</b>ΤΟ ΣΥΝΘΗΜΑ</figcaption></figure>
        <figure><img src="${shot('thumb-partner')}"><figcaption><b>C</b>MRS ROSE</figcaption></figure>
      </div>
      ${foot()}
    </div>`,
  },
  {
    id: 'story-quiz-espresso',
    html: () => `<div class="card cupground">
      ${backdrop('crema-double-2')}
      <img class="shot" src="${shot('front')}" style="width:860px;left:110px;top:90px">
      <div class="over">
        <div class="kicker">Quiz</div>
        <h1>Πόσο κάνει<br>ο <em>espresso;</em></h1>
        <div class="lede">Η απάντηση στο επόμενο story.</div>
      </div>
      ${foot()}
    </div>`,
  },
  {
    id: 'story-quiz-answer',
    html: () => `<div class="card cupground">
      ${backdrop('espresso-splash')}
      <img class="shot" src="${shot('hero-34')}" style="width:1000px;left:60px;top:150px">
      <div class="over">
        <div class="kicker">Η απαντηση / The answer</div>
        <div class="big-price">2.00<small>€</small></div>
        <div class="lede">Espresso, κάθε μέρα από τις 07:00.</div>
      </div>
      ${foot()}
    </div>`,
  },
  {
    id: 'story-see-you-7',
    html: () => `<div class="card cupground">
      ${backdrop('beans-macro')}
      <img class="shot" src="${shot('lid-top')}" style="width:1000px;left:40px;top:250px">
      <svg class="shot" viewBox="0 0 1000 1000" style="width:1000px;left:40px;top:250px">
        <g stroke="${BRAND.gold}" stroke-linecap="round">
          ${Array.from({ length: 12 }, (_, i) => `<line x1="500" y1="92" x2="500" y2="${i % 3 ? 112 : 128}" stroke-width="${i % 3 ? 3 : 6}" transform="rotate(${i * 30} 500 500)"/>`).join('')}
          <line x1="500" y1="500" x2="500" y2="330" stroke-width="16" transform="rotate(210 500 500)"/>
          <line x1="500" y1="500" x2="500" y2="190" stroke-width="9"/>
        </g>
        <circle cx="500" cy="500" r="18" fill="${BRAND.gold}"/>
      </svg>
      <div class="over">
        <div class="kicker">Αυριο πρωι</div>
        <h1>Τα λέμε<br><em>στις 07:00.</em></h1>
      </div>
      ${foot()}
    </div>`,
  },
  {
    id: 'story-cup-prices',
    html: () => `<div class="card cupground" style="padding-bottom:340px">
      ${backdrop('drip-close')}
      <img class="shot" src="${shot('front')}" style="width:860px;left:110px;top:100px">
      <div class="over">
        <div class="kicker">Ο καφες μας</div>
        <div class="rows" style="gap:18px;margin-top:30px">
          <div class="row"><span class="k">Espresso</span><span class="dots"></span><span class="v">2€</span></div>
          <div class="row"><span class="k">Americano</span><span class="dots"></span><span class="v">2€</span></div>
          <div class="row"><span class="k">Macchiato</span><span class="dots"></span><span class="v">2.10€</span></div>
          <div class="row"><span class="k">Cappuccino</span><span class="dots"></span><span class="v">2.60€</span></div>
          <div class="row"><span class="k">Freddo espresso</span><span class="dots"></span><span class="v">2.40€</span></div>
          <div class="row"><span class="k">Freddo cappuccino</span><span class="dots"></span><span class="v">2.60€</span></div>
        </div>
      </div>
      ${foot()}
    </div>`,
  },
  // ─── Καλοκαίρι / Χειμώνας: seasonal coffee stories, same grounds as the feed series. ──
  {
    id: 'summer-freddo',
    html: () => `<div class="card summer">
      <img class="mark" src="${logo}">
      <div class="kicker">Καλοκαιρι</div>
      <h1>Καύσωνας;<br><em>Freddo.</em></h1>
      <div class="lede">Freddo espresso 2.40€<br>Freddo cappuccino 2.60€<br>Espresso 2€<br>Cappuccino 2.60€</div>
      ${foot()}
    </div>`,
  },
  {
    id: 'winter-hot',
    html: () => `<div class="card" style="background:linear-gradient(180deg,#33231A 0%,#22170F 100%)">
      <img class="mark" src="${logo}">
      <div class="kicker">Χειμωνας</div>
      <h1>Κρύο έξω.<br><em>Ζεστός</em> μέσα.</h1>
      <div class="lede">Espresso 2€<br>Freddo espresso 2.40€<br>Cappuccino 2.60€<br>Freddo cappuccino 2.60€</div>
      ${foot()}
    </div>`,
  },
  // ─── Photo stories: the real photos again, new lines. Never 21-35-35 (unlisted happy-hour offer). ──
  ...[
    ['ph-morning', '21-34-43', 'Απο τις 07:00', 'Πρώτος καφές<br><em>της ημέρας;</em>', 'Κάθε μέρα, Ρόδου 68.', 'top'],
    ['ph-espresso', '21-34-55', 'Espresso', 'Ζεστός<br><em>ή freddo;</em>', 'Espresso 2€ · Freddo espresso 2.40€'],
    ['ph-takeaway', '21-35-16', 'Ροδου 68', 'Takeaway;', 'Κάθε μέρα 07:00 – 22:00', 'top'],
    ['ph-break', '21-36-13', 'Διαλειμμα', 'Διάλειμμα;<br><em>Ένας espresso.</em>', '2€', 'top'],
    ['ph-for-you', '21-36-24', 'Η παραγγελια σου', 'Μέτριο,<br><em>μαύρη πάλι;</em>', '', 'top'],
    ['ph-grind', '21-36-37', 'Φρεσκο αλεσμα', 'Αλέθουμε<br><em>κάθε μέρα.</em>', 'Φρέσκος καφές σε κάθε ποτήρι.'],
    ['ph-delivery', '21-34-55', 'Delivery', 'Καφές<br><em>στην πόρτα σου.</em>', 'e-food · Wolt · Box'],
  ].map(([id, t, kicker, headline, lede, at]) => ({ id, html: () => photoStory({ img: `Screenshot_2026-09-20_${t}.png`, kicker, headline, lede, at }) })),
  // ─── Photographer shoot, 2026-10-26 (social/photos/shoot/). ──
  ...[
    ['ps-open', 'storefront-day', 'Καλημερα', 'Ανοίξαμε.<br><em>07:00.</em>', 'Ρόδου 68, Κάτω Πατήσια.', 'plate:2'],
    ['ps-closing', 'shutter-christ-2', 'Διευθυνση', 'Θα μας βρεις<br><em>Ρόδου 68.</em>', 'Κάτω Πατήσια', 'plate:1.97'],
    ['ps-faith', 'shutter-faith', 'Ροδου 68', 'Faith<br><em>over fear.</em>', '', 'plate'],
    ['ps-heaven', 'cup-black', 'Take away', 'Ένας<br><em>για τον δρόμο;</em>', 'Από τις 07:00'],
    ['ps-waiting', 'cup-counter-2', 'Σημερα', 'Έχεις πιει<br><em>καφέ ακόμα;</em>', 'Από τις 07:00 σε περιμένουμε'],
    ['ps-pair', 'cup-pair', 'Για δυο', 'Κερνάς<br><em>ή κερνάω;</em>', 'Κάνε tag τον φίλο σου.'],
    ['ps-foam', 'foam-macro', 'Στο μενου', 'Cappuccino<br><em>2.60€.</em>', ''],
    ['ps-latte', 'milk-steam', 'Στο μενου', 'Cappuccino latte<br><em>2.70€.</em>', 'Ζεστό, με γάλα.'],
    ['ps-splash', 'espresso-splash', 'Espresso · 2€', 'Χρειάζεσαι<br><em>έναν espresso;</em>', ''],
    ['ps-crema', 'crema-double-2', 'Espresso', 'Ένας espresso<br><em>και φεύγεις;</em>', ''],
    ['ps-drop', 'last-drop', 'Espresso', 'Δεύτερος<br><em>καφές;</em>', 'Espresso 2€'],
    ['ps-beans', 'beans-macro', 'Καλημερα', 'Καλημέρα.<br><em>Έναν καφέ;</em>', ''],
    ['ps-hopper', 'beans-hopper', 'Καθε μερα', 'Σε περιμένουμε<br><em>πρωί, μεσημέρι<br>ή βράδυ.</em>', '07:00 – 22:00'],
    ['ps-mrs-rose', 'mrs-rose-tins', '', 'Ο κλασικός μας.<br><em>Espresso 2€.</em>', ''],
    ['ps-guide', 'coffee-guide', 'Ερωτηση', 'Τι πίνεις<br><em>σήμερα;</em>', 'Στείλε μας DM.'],
    ['ps-peinirli', 'vitrine-peinirli', 'Η βιτρινα', 'Πεϊνιρλί<br><em>2.80€.</em>', ''],
    ['ps-pies', 'vitrine-pies', 'Η βιτρινα', 'Τυρόπιτα<br><em>1.60€.</em>', 'Σπανακόπιτα 2.50€'],
    ['ps-craving', 'pastry-sesame', 'Λιγουρα', 'Πείνασες;<br><em>Δες τη βιτρίνα.</em>', 'Ρόδου 68'],
    ['ps-sesame', 'bread-sesame', 'Η βιτρινα', 'Μην<br><em>αντισταθείς.</em>', ''],
    ['ps-window', 'vitrine-window', 'Περνας;', 'Τι θα τσιμπήσουμε<br><em>σήμερα;</em>', 'Ρόδου 68'],
    ['ps-shift', 'staff-machine', 'Πισω απο τον παγκο', 'Ο καφές σου<br><em>σε περιμένει.</em>', 'Από τις 07:00'],
    ['ps-smile', 'apron-cup', '', 'Καλημέρα<br><em>από τον πάγκο.</em>', '', 'plate'],
    ['ps-apron', 'apron-cup', '', 'Ένα cappuccino;<br><em>Έρχεται.</em>', '2.60€', 'plate'],
    ['ps-phone', 'staff-jacket', 'Τηλεφωνο', '<em>211 218 1815</em>', 'Ρόδου 68, Κάτω Πατήσια.'],
    ['ps-inside', 'interior', 'Μεσα', 'Κάτσε<br><em>λίγο.</em>', '07:00 – 22:00'],
    ['ps-street', 'cup-street-left', 'Κανε tag', 'Το ποτήρι σου<br><em>στη γειτονιά.</em>', '@blessedcoffee2024'],
    ['ps-delivery', 'cup-counter', 'Delivery', 'Παράγγειλε<br><em>από το κινητό.</em>', 'e-food · Wolt · Box'],
    ['ps-summer', 'cup-street-left', 'Καλοκαιρι', 'Freddo<br><em>για τον δρόμο.</em>', 'Freddo espresso 2.40€'],
    ['ps-winter-steam', 'espresso-steam', 'Cappuccino · 2.60€', 'Κρύο έξω;<br><em>Ζεστό cappuccino μέσα.</em>', ''],
  ].map(([id, img, kicker, headline, lede, pos]) => ({ id, html: () => photoStory({ img: `shoot/${img}.jpg`, kicker, headline, lede, pos }) })),
  // ─── Round 2: the same photos with new lines, so the rotation runs twice as long before a story
  //     comes back word for word. Ids end in -2. ──
  ...[
    ['ph-morning-2', '21-34-43', 'Ροδου 68', 'Καφές<br><em>για το πρωί.</em>', 'Από τις 07:00.', 'top'],
    ['ph-espresso-2', '21-34-55', 'Στο μενου', 'Espresso ή<br><em>cappuccino;</em>', 'Espresso 2€ · Cappuccino 2.60€'],
    ['ph-takeaway-2', '21-35-16', 'Take away', 'Βιάζεσαι;<br><em>Take away.</em>', 'Ρόδου 68', 'top'],
    ['ph-break-2', '21-36-13', 'Διαλειμμα', 'Κάτσε να πιεις<br><em>έναν καφέ.</em>', 'Cappuccino 2.60€', 'top'],
    ['ph-for-you-2', '21-36-24', 'Η παραγγελια σου', 'Όπως<br><em>τον πίνεις.</em>', 'Πες μας και τον φτιάχνουμε.', 'top'],
    ['ph-grind-2', '21-36-37', 'Φρεσκο αλεσμα', 'Φρέσκος καφές,<br><em>κάθε φορά.</em>', 'Ρόδου 68'],
    ['ph-delivery-2', '21-34-55', 'Delivery', 'Μένεις μέσα;<br><em>Τον φέρνουμε.</em>', 'e-food · Wolt · Box'],
  ].map(([id, t, kicker, headline, lede, at]) => ({ id, html: () => photoStory({ img: `Screenshot_2026-09-20_${t}.png`, kicker, headline, lede, at }) })),
  ...[
    ['ps-open-2', 'storefront-day', 'Ροδου 68', 'Ανοιχτά<br><em>κάθε μέρα.</em>', 'Από τις 07:00', 'plate:2'],
    ['ps-closing-2', 'shutter-christ-2', 'Κατω Πατησια', 'Ξέρεις<br><em>πού είμαστε;</em>', 'Ρόδου 68', 'plate:1.97'],
    ['ps-faith-2', 'shutter-faith', 'Το μαγαζι', 'Μας βρίσκεις<br><em>στη Ρόδου 68.</em>', 'Κάτω Πατήσια', 'plate'],
    ['ps-heaven-2', 'cup-black', 'Take away', 'Στον δρόμο<br><em>για τη δουλειά;</em>', 'Από τις 07:00'],
    ['ps-waiting-2', 'cup-counter-2', 'Σημερα', 'Τον πίνεις<br><em>σκέτο ή γλυκό;</em>', ''],
    ['ps-pair-2', 'cup-pair', 'Για δυο', 'Έρχεσαι<br><em>με παρέα;</em>', 'Ρόδου 68'],
    ['ps-foam-2', 'foam-macro', 'Cappuccino', 'Ζεστό<br><em>ή freddo;</em>', 'Espresso 2€<br>Freddo espresso 2.40€<br>Cappuccino 2.60€<br>Freddo cappuccino 2.60€'],
    ['ps-latte-2', 'milk-steam', 'Cappuccino latte · 2.70€', 'Κρύο<br><em>σήμερα;</em>', 'Πάρε κάτι ζεστό.'],
    ['ps-splash-2', 'espresso-splash', 'Espresso', 'Γρήγορος<br><em>και δυνατός.</em>', '2€'],
    ['ps-crema-2', 'crema-double-2', 'Espresso', 'Σκέτος<br><em>ή με ζάχαρη;</em>', ''],
    ['ps-drop-2', 'last-drop', 'Espresso', 'Espresso ή<br><em>Americano;</em>', '2€ και τα δύο'],
    ['ps-beans-2', 'beans-macro', 'Mrs Rose · Il Modo', 'Δύο χαρμάνια.<br><em>Ποιο σου πάει;</em>', ''],
    ['ps-hopper-2', 'beans-hopper', 'Καθε μερα', 'Καφές μετά<br><em>το φαγητό;</em>', 'Ως τις 22:00.'],
    ['ps-mrs-rose-2', 'mrs-rose-tins', '', 'Freddo espresso<br><em>2.40€.</em>', ''],
    ['ps-guide-2', 'coffee-guide', 'Ερωτηση', 'Ελληνικός<br><em>ή freddo;</em>', 'Πες μας στο DM.'],
    ['ps-peinirli-2', 'vitrine-peinirli', 'Πρωινο', 'Πεϊνιρλί<br><em>και καφές.</em>', 'Από τις 07:00'],
    ['ps-pies-2', 'vitrine-pies', 'Η βιτρινα', 'Πίτες<br><em>από 1.60€.</em>', 'Τυρόπιτα · Σπανακόπιτα · Λουκανικόπιτα'],
    ['ps-craving-2', 'pastry-sesame', 'Η βιτρινα', 'Κάτι<br><em>αλμυρό;</em>', 'Ρόδου 68'],
    ['ps-sesame-2', 'bread-sesame', 'Πρωινο', 'Πρωινό<br><em>από τις 07:00.</em>', 'Καφές και κάτι αλμυρό.'],
    ['ps-snack-2', 'snack-cup', 'Sandwiches', 'Για το<br><em>μεσημέρι.</em>', 'Από 2.60€'],
    ['ps-window-2', 'vitrine-window', 'Περνας;', 'Η βιτρίνα<br><em>γέμισε.</em>', 'Ρόδου 68'],
    ['ps-shift-2', 'staff-machine', 'Πισω απο τον παγκο', 'Freddo cappuccino;<br><em>Έρχεται.</em>', '2.60€'],
    ['ps-smile-2', 'apron-cup', '', 'Τι θα<br><em>πάρεις;</em>', '', 'plate'],
    ['ps-apron-2', 'apron-cup', '', 'Με καπάκι,<br><em>για τον δρόμο.</em>', '', 'plate'],
    ['ps-phone-2', 'staff-jacket', 'Τηλεφωνο', '<em>211 218 1815</em>', '07:00 – 22:00'],
    ['ps-inside-2', 'interior', 'Μεσα', 'Ζεστά<br><em>εδώ μέσα.</em>', '07:00 – 22:00'],
    ['ps-street-2', 'cup-street-left', 'Κανε tag', 'Πού πάει<br><em>ο καφές σου;</em>', '@blessedcoffee2024'],
    ['ps-delivery-2', 'cup-counter', 'Delivery', 'Από το γραφείο;<br><em>Παράγγειλε.</em>', 'e-food · Wolt · Box'],
  ].map(([id, img, kicker, headline, lede, pos]) => ({ id, html: () => photoStory({ img: `shoot/${img}.jpg`, kicker, headline, lede, pos }) })),
];

// ─── RENDER ──────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const stories = only.length ? STORIES.filter((s) => only.includes(s.id)) : STORIES;
if (!stories.length) {
  console.error(`No matching stories. Available: ${STORIES.map((s) => s.id).join(', ')}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: SCALE,
});

for (const story of stories) {
  await page.setContent(`<style>${CSS}</style>${story.html()}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${TMP}/${story.id}.png` });
  console.log(`rendered ${story.id}`);
}

await browser.close();

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
console.log(`\n${stories.length} stor${stories.length === 1 ? 'y' : 'ies'} in social/library-stories/`);
