// Renders cup-spin.mp4 (1080x1920, 8s seamless loop) and exports cup.glb from cup.html (the site's cup).
//   node social/cup/render.mjs      needs ffmpeg
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = 3011, FPS = 30, SECONDS = 8, N = FPS * SECONDS, TMP = `${HERE}/.frames`;
const CHROME = process.env.CHROME_PATH || '/home/akos/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
const srv = await serve(resolve(HERE, '../..'), PORT);
const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`http://127.0.0.1:${PORT}/social/cup/cup.html`);
await page.waitForFunction(() => window.ready, null, { timeout: 60000 });

writeFileSync(`${HERE}/cup.glb`, Buffer.from(await page.evaluate(() => window.glb()), 'base64'));

mkdirSync(TMP, { recursive: true });
for (let i = 0; i < N; i++) {
  await page.evaluate((t) => window.frame(t), i / N);
  await page.screenshot({ path: `${TMP}/${String(i).padStart(4, '0')}.png` });
}
await browser.close();
srv.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${TMP}/%04d.png`,
  '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${HERE}/cup-spin.mp4`]);
rmSync(TMP, { recursive: true });
console.log('wrote cup.glb, cup-spin.mp4');
