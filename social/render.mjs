// Renders the Blessed Coffee social content library.
//   node social/render.mjs            all posts
//   node social/render.mjs hours early only these ids
//
// Every fact below is copied from src/App.jsx or the live site. Nothing here is
// invented: a wrong price or a wrong opening time published to 721 followers is
// worse than no post at all.

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
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
// Backdrop plates: anonymous central-Athens street/neighbourhood texture only,
// no recognisable landmark, no product shots. Mixed sourcing is fine, AI-generated
// or a real stock photo the user curated, both get the same heavy scrim treatment
// below since the point is staying anonymous texture, never a documentary shot.
const plate = (f) => dataUri(`${ROOT}/social/plates`, f);
// Real shop photography: the cup, the machine, the storefront. No scrim needed,
// this IS the product, unlike the AI plates it never needs disguising.
const photo = (f) => dataUri(`${ROOT}/social/photos`, f);

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
  /* Backdrop layer: the AI urban plate drops in here, never as the subject.
     Heavy scrim + grain is what keeps it from reading as a stock photo. */
  .bg { position: absolute; inset: 0; z-index: 0; }
  .bg img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(0.55) contrast(1.05); }
  .bg::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(8,8,8,.72) 0%, rgba(8,8,8,.88) 55%, rgba(6,6,6,.96) 100%);
  }
  /* Real shop photos get a light bottom-only fade for caption legibility, not
     the heavy full-frame scrim the AI plates need. No grayscale/contrast either. */
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
`;

const shell = (inner, bg, real) => `<div class="card">
  ${bg ? `<div class="bg${real ? ' real' : ''}"><img src="${bg}"></div>` : ''}
  ${inner}
  <div class="foot"><span>${BRAND.address}</span><span>${BRAND.site}</span></div>
</div>`;

// ─── POSTS ───────────────────────────────────────────────────────────────────
// caption.el / caption.en are published together: the cafe serves both languages
// and the existing feed already mixes them.
const POSTS = [
  {
    id: 'hours',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body center" style="align-items:stretch">
        <div class="kicker" style="text-align:center">Ωραριο / Hours</div>
        <div class="rows">
          <div class="row"><span class="k">ΔΕΥ – ΣΑΒ</span><span class="dots"></span><span class="v">06:00 – 22:00</span></div>
          <div class="row"><span class="k">ΚΥΡΙΑΚΗ</span><span class="dots"></span><span class="v">07:00 – 22:00</span></div>
        </div>
        <div class="el">Κάθε μέρα, από νωρίς. / Open early, every day.</div>
      </div>`),
    caption: {
      el: 'Είμαστε εδώ από τις 6 το πρωί, κάθε μέρα.',
      en: "We open at 6am, every day. Sundays from 7.",
    },
  },
  {
    id: 'early',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Ανοιχτα απο τις 06:00</div>
        <h1>The first<br><em>coffee</em><br>of the day.</h1>
        <div class="rule"></div>
        <div class="lede">Ο καφές σου σε περιμένει πριν από όλους.</div>
      </div>`),
    caption: {
      el: 'Πριν τη βάρδια, πριν το γραφείο, πριν ξυπνήσει η γειτονιά. Από τις 06:00.',
      en: 'Before the shift, before the office, before the neighbourhood wakes up. Open from 6am.',
    },
  },
  {
    id: 'espresso-price',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Espresso</div>
        <div class="big-price">1.80<small>€</small></div>
        <div class="rule"></div>
        <div class="lede">Freddo espresso 2.30€<br>Freddo cappuccino 2.60€</div>
      </div>`),
    caption: {
      el: 'Espresso 1.80€. Freddo espresso 2.30€. Στα Κάτω Πατήσια, κάθε μέρα από τις 06:00.',
      en: 'Espresso €1.80. Freddo espresso €2.30. Kato Patisia, every day from 6am.',
    },
  },
  {
    id: 'delivery',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body">
        <div class="kicker">Delivery</div>
        <h1 class="sm">Φέρνουμε<br>τον καφέ<br><em>σε σένα.</em></h1>
        <div class="partners">
          <span><img src="${asset('efood-logo.webp')}"></span>
          <span><img src="${asset('wolt-logo.webp')}"></span>
          <span><img src="${asset('box-logo.png')}"></span>
        </div>
      </div>`),
    caption: {
      el: 'e-food, Wolt και Box. Ο καφές και η πίτα σου, στην πόρτα σου.',
      en: 'Now on e-food, Wolt and Box. Coffee and pastries delivered across Kato Patisia.',
    },
  },
  {
    id: 'hiring',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Ζητειται / We are hiring</div>
        <h1>Barista<br><em>wanted.</em></h1>
        <div class="rule"></div>
        <div class="lede">Με πάθος για τον specialty καφέ. Πλήρης ή μερική απασχόληση.</div>
      </div>`),
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
  // ─── Real Google reviews, quoted as-is. Strongest kind of proof: not our words. ──
  {
    id: 'review-martha',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">★★★★★ Google Review</div>
        <div class="quote">"Nice coffee and something for cravings, it's a must, with fast and polite service."</div>
        <div class="rule"></div>
        <div class="attrib">Martha Grigoriou</div>
      </div>`),
    caption: {
      el: 'Πέντε αστέρια από πραγματικούς πελάτες. "Ωραίος καφές και κάτι για τη λιγούρα, είναι ό,τι πρέπει, με γρήγορη και ευγενική εξυπηρέτηση." Έγραψε η Martha Grigoriou στο Google Maps.',
      en: 'Five stars, real customer. "Nice coffee and something for cravings, it\'s a must, with fast and polite service." From Martha Grigoriou, via Google Maps.',
    },
  },
  {
    id: 'review-ninaki',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">★★★★★ Google Review</div>
        <div class="quote">"The guys are amazing: helpful, clean, and the coffee is awesome in quality and technique."</div>
        <div class="rule"></div>
        <div class="attrib">Ninaki Euangelou</div>
      </div>`),
    caption: {
      el: '"Τα παιδιά είναι καταπληκτικά, πολύ ομαδικά σε όλες τις βάρδιες, εξυπηρετικότατα κ αμεσότατα! Καθαρά, περιποιημένα, νόστιμα, ο καφές φοβερός και από ποιότητα και από τεχνική!" Έγραψε η Ninaki Euangelou στο Google Maps.',
      en: '"The guys are amazing, very helpful and direct, clean, and the coffee is awesome in quality and technique!" From Ninaki Euangelou, via Google Maps.',
    },
  },
  {
    id: 'review-icecube',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">★★★★★ Google Review</div>
        <div class="quote">"The only shop I've seen on delivery that sends you a glass of ice for your energy drink."</div>
        <div class="rule"></div>
        <div class="attrib">Blackoni Chris</div>
      </div>`),
    caption: {
      el: '"Το μοναδικό μαγαζί που είδα στο ντελίβερι να σου στέλνουν ποτηράκι με πάγο για το energy drink." Έγραψε ο Blackoni Chris στο Google Maps.',
      en: '"The only shop I\'ve seen on delivery that sends you a glass of ice for your energy drink." From Blackoni Chris, via Google Maps.',
    },
  },
  // ─── Menu, priced straight from MENU in src/App.jsx. ────────────────────────
  {
    id: 'old-school',
    html: (bg, real) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Για τους παραδοσιακους</div>
        <h1>Greek.<br>Filter.<br><em>NES.</em></h1>
        <div class="rule"></div>
        <div class="lede">Ελληνικός 1.80€ · Φίλτρου 2€ · NES 1.80€ · Americano 2€</div>
      </div>`, bg, real),
    bg: plate('athens-kiosk-day.png'),
    // Light scrim despite being a plate, not a real venue photo: these newer bright/
    // colorful plates lose the whole point of "brighter, more positive" under the
    // old heavy dark scrim, which was tuned for the original moody set.
    real: true,
    caption: {
      el: 'Ελληνικός, φίλτρου, νες, americano. Οι κλασικοί, στην τιμή που τους αξίζει.',
      en: 'Greek coffee, filter, NES, americano. The classics, at the price they deserve.',
    },
  },
  {
    id: 'bougatsa',
    html: (bg) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Μπουγατσα Κρεμα</div>
        <div class="big-price">2.80<small>€</small></div>
        <div class="rule"></div>
        <div class="lede">Φλογέρα Φιλαδέλφεια 2.80€<br>Κρουασάν 2.50€</div>
      </div>`, bg),
    bg: plate('athens-balconies.webp'),
    caption: {
      el: 'Μπουγάτσα κρέμα 2.80€. Φλογέρα Φιλαδέλφεια 2.80€. Φρέσκα, κάθε πρωί.',
      en: 'Cream bougatsa €2.80. Philadelphia flogera €2.80. Fresh, every morning.',
    },
  },
  {
    id: 'sweet-lineup',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body center" style="align-items:stretch">
        <div class="kicker" style="text-align:center">Γλυκο;</div>
        <div class="rows">
          <div class="row"><span class="k">Cheesecake</span><span class="dots"></span><span class="v">2.90€</span></div>
          <div class="row"><span class="k">Sweet Dubai</span><span class="dots"></span><span class="v">3.20€</span></div>
          <div class="row"><span class="k">Black Forest</span><span class="dots"></span><span class="v">3.20€</span></div>
          <div class="row"><span class="k">Προφιτερόλ</span><span class="dots"></span><span class="v">2.90€</span></div>
        </div>
        <div class="el">Τέσσερις επιλογές, μια αδυναμία.</div>
      </div>`),
    caption: {
      el: 'Cheesecake, Sweet Dubai, Black Forest, προφιτερόλ. Τέσσερις επιλογές, μια αδυναμία.',
      en: 'Cheesecake, Sweet Dubai, Black Forest, profiterole. Four options, one weakness.',
    },
  },
  {
    id: 'savory-pastries',
    html: () =>
      shell(`<img class="mark" src="${logo}">
      <div class="body center" style="align-items:stretch">
        <div class="kicker" style="text-align:center">Αλμυρο;</div>
        <div class="rows">
          <div class="row"><span class="k">Τυρόπιτα Κουρού</span><span class="dots"></span><span class="v">2.50€</span></div>
          <div class="row"><span class="k">Ζαμπονοτυρόπιτα</span><span class="dots"></span><span class="v">2.80€</span></div>
          <div class="row"><span class="k">Λουκανικόπιτα</span><span class="dots"></span><span class="v">2.50€</span></div>
          <div class="row"><span class="k">Σπανακόπιτα με Τυρί</span><span class="dots"></span><span class="v">2.50€</span></div>
        </div>
        <div class="el">Φρέσκες, κάθε μέρα.</div>
      </div>`),
    caption: {
      el: 'Τυρόπιτα κουρού, ζαμπονοτυρόπιτα, λουκανικόπιτα, σπανακόπιτα με τυρί. Φρέσκες, κάθε μέρα.',
      en: 'Kourou cheese pie, ham and cheese pie, sausage pie, spinach and cheese pie. Fresh, every day.',
    },
  },
  {
    id: 'beer',
    html: (bg) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body center" style="align-items:stretch">
        <div class="kicker" style="text-align:center">Μπυρα / Beer</div>
        <div class="rows">
          <div class="row"><span class="k">Amstel</span><span class="dots"></span><span class="v">4€</span></div>
          <div class="row"><span class="k">Heineken</span><span class="dots"></span><span class="v">4€</span></div>
          <div class="row"><span class="k">Corona</span><span class="dots"></span><span class="v">4€</span></div>
          <div class="row"><span class="k">Alfa</span><span class="dots"></span><span class="v">4€</span></div>
        </div>
        <div class="el">Και μετά τον καφέ.</div>
      </div>`, bg),
    bg: plate('athens-wires-dusk.webp'),
    caption: {
      el: 'Μπύρα υπάρχει και στο Blessed. Amstel, Heineken, Corona, Alfa.',
      en: "Yes, we've got beer too. Amstel, Heineken, Corona, Alfa.",
    },
  },
  // ─── Neighbourhood atmosphere: AI or curated-stock backdrop plates, low opacity, minimal type. ──
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
    bg: plate('athens-street-bougainvillea.png'),
    real: true,
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
        <div class="kicker">06:00</div>
        <h1 class="sm">Πριν χαράξει,<br><em>είμαστε εδώ.</em></h1>
        <div class="rule"></div>
        <div class="lede">Ανοιχτά κάθε μέρα από τις 06:00.</div>
      </div>`, bg, real),
    bg: plate('athens-square-morning-light.png'),
    real: true,
    caption: {
      el: 'Πριν χαράξει, είμαστε εδώ. Ανοιχτά κάθε μέρα από τις 06:00.',
      en: "Before sunrise, we're here. Open every day from 6am.",
    },
  },
  // ─── Hiring, second role. ─────────────────────────────────────────────────────
  {
    id: 'hiring-driver',
    html: (bg) =>
      shell(`<img class="mark" src="${logo}">
      <div class="body tight">
        <div class="kicker">Ζητειται / We are hiring</div>
        <h1>Delivery<br><em>driver.</em></h1>
        <div class="rule"></div>
        <div class="lede">Για πρωινές και βραδινές βάρδιες. Ευέλικτο ωράριο.</div>
      </div>`),
    // Intentionally plain, like the other hiring post: no bg needed here.
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
  // Prompts for their AI backdrops live in social/seasonal-plate-prompts.md.
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
    bg: plate('athens-newyear-lights.png'),
    real: true,
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
    bg: plate('athens-bougainvillea-bloom.png'),
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
    bg: plate('athens-street-summer-view.png'),
    real: true,
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
    bg: plate('athens-apokries-streamers.png'),
    real: true,
    caption: {
      el: 'Καλές Απόκριες από όλους εμάς στο Blessed.',
      en: 'Happy Apokries (Greek Carnival season) from everyone at Blessed.',
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
  writeFileSync(
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
