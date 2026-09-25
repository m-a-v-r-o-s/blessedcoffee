// Renders posed, transparent 2x stills of the cup into shots/, for the feed and story cards
// (social/render.mjs, social/render-stories.mjs) to composite over brand grounds.
//   node social/cup/shots.mjs              all shots
//   node social/cup/shots.mjs hero-low     only these
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = 3013;
const CHROME = process.env.CHROME_PATH || '/home/akos/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';

// Panel centres and light rigs, shared with render-reels.mjs.
export const PANEL = { logo: 0, slogan: 0.37, partner: 0.69 };
// LID: tight overhead-left key, rakes a highlight across the black lid. LABEL: wider cone, so the
// spot's edge never draws a hard diagonal across a close-up of the paper.
export const LID = { keyPos: [-200, 420, 200], keyI: 12000, keyAngle: 0.35, rimI: 3.5, env: 0.15, exposure: 1 };
export const LABEL = { keyPos: [-260, 300, 420], keyI: 11000, keyAngle: 0.6, rimI: 3, env: 0.18, exposure: 1 };

// name: [css width, css height, pose]
export const SHOTS = {
  'hero-low': [900, 1150, { ...LID, rot: 0.02, cam: [30, 25, 330], look: [0, 80, 0], fov: 38 }],
  'hero-34': [860, 1000, { ...LID, rot: -0.06, tilt: 0.12, cam: [80, 260, 380], look: [0, 75, 0], fov: 30 }],
  'lid-top': [1000, 1000, { ...LID, rot: 0.02, cam: [0, 520, 1], look: [0, 110, 0], fov: 20, keyPos: [-300, 380, -100], keyI: 14000, rimI: 2, env: 0.2 }],
  'logo-close': [1080, 1350, { ...LABEL, rot: PANEL.logo, cam: [0, 90, 205], look: [0, 76, 0], fov: 32 }],
  'slogan-close': [1080, 1350, { ...LABEL, rot: PANEL.slogan, cam: [0, 90, 205], look: [0, 76, 0], fov: 32 }],
  'partner-close': [1080, 1350, { ...LABEL, rot: PANEL.partner, cam: [0, 110, 250], look: [0, 50, 0], fov: 34 }],
  'front': [620, 820, { ...LABEL, rot: PANEL.logo, cam: [0, 150, 560], look: [0, 72, 0], fov: 24 }],
  'thumb-logo': [300, 400, { ...LABEL, rot: PANEL.logo, cam: [0, 120, 400], look: [0, 84, 0], fov: 24 }],
  'thumb-slogan': [300, 400, { ...LABEL, rot: PANEL.slogan, cam: [0, 120, 400], look: [0, 84, 0], fov: 24 }],
  'thumb-partner': [300, 400, { ...LABEL, rot: PANEL.partner, cam: [0, 120, 400], look: [0, 84, 0], fov: 24 }],
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const only = process.argv.slice(2);
  const names = only.length ? only : Object.keys(SHOTS);
  mkdirSync(`${HERE}/shots`, { recursive: true });
  const srv = await serve(HERE, PORT);
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const name of names) {
    const [width, height, pose] = SHOTS[name];
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${PORT}/cup.html?clean`);
    await page.waitForFunction(() => window.ready, null, { timeout: 60000 });
    await page.evaluate((p) => window.pose(p), pose);
    await page.screenshot({ path: `${HERE}/shots/${name}.png`, omitBackground: true });
    await page.close();
    console.log(`shot ${name}`);
  }
  await browser.close();
  srv.close();
}
