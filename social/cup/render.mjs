// Renders cup-spin.mp4 (1080x1920, 8s seamless loop) and exports cup.glb from cup.html.
// Usage: from this folder, `python3 -m http.server 3011 &` then `node render.mjs`. Needs ffmpeg.
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FPS = 30, SECONDS = 8, N = FPS * SECONDS, TMP = '.frames';
const browser = await chromium.launch({ headless: true, executablePath: '/home/akos/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('http://localhost:3011/cup.html');
await page.waitForFunction(() => window.ready, null, { timeout: 60000 });

writeFileSync('cup.glb', Buffer.from(await page.evaluate(() => window.glb()), 'base64'));

mkdirSync(TMP, { recursive: true });
for (let i = 0; i < N; i++) {
  await page.evaluate((t) => window.frame(t), i / N);
  await page.screenshot({ path: `${TMP}/${String(i).padStart(4, '0')}.png` });
}
await browser.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${TMP}/%04d.png`,
  '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'cup-spin.mp4']);
rmSync(TMP, { recursive: true });
console.log('wrote cup.glb, cup-spin.mp4');
