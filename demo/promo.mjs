// node demo/promo.mjs: screen-records the site in a phone viewport and builds a 1080x1920 Instagram
// reel in demo/out/, with the beat from demo/beat.py underneath. The take: the shutter rolls up on
// the hero, then the 3D cup gets flicked round. Frames come from Chromium's screencast, cut with ffmpeg.
// Default BASE is a local `astro preview` (npm run build first); BASE=https://www.blessed.cafe for live.
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'demo/out')
const TMP = mkdtempSync(join(tmpdir(), 'blessed-promo-')) // frames, left for the OS to clear
const BASE = process.env.BASE || 'http://localhost:3002'
const SPEED = 1 // playback speed-up of the recording
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`
const now = () => Date.now() / 1000
const wait = ms => new Promise(r => setTimeout(r, ms))
mkdirSync(OUT, { recursive: true })

function record(page) {
  const frames = []
  return page.context().newCDPSession(page).then(async cdp => {
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      const file = join(TMP, String(frames.length).padStart(6, '0') + '.jpg')
      writeFileSync(file, Buffer.from(data, 'base64'))
      frames.push({ file, t: metadata.timestamp })
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920 })
    return frames
  })
}

// Finger dot, since headless capture shows no finger: it follows the pointer while pressed, so a
// drag on the cup reads as a swipe. Cookie choice pre-set so the banner stays away.
function overlay() {
  localStorage.setItem('bc_consent', 'rejected')
  addEventListener('DOMContentLoaded', () => {
    let dot
    const at = e => Object.assign(dot.style, { left: e.clientX + 'px', top: e.clientY + 'px' })
    addEventListener('pointerdown', e => {
      dot = document.createElement('div')
      Object.assign(dot.style, { position: 'fixed', width: '46px', height: '46px', borderRadius: '50%', background: 'rgb(255 255 255 / 55%)', border: '2px solid rgb(11 11 11 / 35%)', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 99999 })
      at(e)
      document.body.appendChild(dot)
      dot.animate([{ transform: 'translate(-50%, -50%) scale(.5)' }, { transform: 'translate(-50%, -50%) scale(1)' }], { duration: 120, easing: 'ease-out' })
    }, true)
    addEventListener('pointermove', e => dot && at(e), true)
    addEventListener('pointerup', () => {
      const d = dot; dot = null
      d?.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 }], { duration: 400, easing: 'ease-out' }).finished.then(() => d.remove())
    }, true)
  })
}

// Horizontal swipe across the middle of an element: dx px over ms, then lift (fast = a flick).
async function swipe(page, selector, dx, ms) {
  const b = await page.locator(selector).boundingBox()
  const x = b.x + b.width / 2 - dx / 2, y = b.y + b.height * 0.55, steps = Math.round(ms / 16)
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    const p = i / steps
    await page.mouse.move(x + dx * (1 - (1 - p) ** 2), y)
    await wait(ms / steps)
  }
  await page.mouse.up()
}

// Eased glide to a y offset or an element (centred), with a fixed duration so the cut is predictable.
const glide = (page, target, ms) => page.evaluate(([target, ms]) => new Promise(done => {
  const from = scrollY
  let to = target
  if (typeof target !== 'number') {
    const r = document.querySelector(target).getBoundingClientRect()
    to = r.top + scrollY - (innerHeight - r.height) / 2
  }
  const t0 = performance.now()
  const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / ms)
    scrollTo({ top: from + (to - from) * ease(p), behavior: 'instant' })
    p < 1 ? requestAnimationFrame(step) : done()
  }
  requestAnimationFrame(step)
}), [target, ms])

// ---------- run ----------

// Real GPU through ANGLE on Vulkan: on SwiftShader the cup renders at a few fps and the take drags out.
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'] })
try {
  const ctx = await browser.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 1080 / 405, isMobile: true, hasTouch: true })
  await ctx.addInitScript(overlay)
  const page = await ctx.newPage()
  // Warm the cache (photos, three.js, the cup label) before the take.
  await page.goto(BASE, { waitUntil: 'load' })
  for (const s of ['.shops', '.bean', '.faith', '.cup .stage', 'footer']) await glide(page, s, 250)
  await glide(page, '.cup .stage', 250)
  await page.waitForSelector('.cup .stage.live', { timeout: 30000 })
  await wait(1500)
  await glide(page, 0, 1)

  const frames = await record(page)
  await page.reload({ waitUntil: 'load' })
  const start = now()
  await wait(1100)

  // Opening: the shutter rolls up, the bento settles, the logo coin sways in.
  const shut = await page.evaluate(() => document.querySelector('.hero').offsetHeight - innerHeight)
  await glide(page, shut * 0.8, 3000)
  await wait(1700)

  // Down to the cup: the scroll turns it as it comes in, then flicks.
  await glide(page, '.cup .stage', 2400)
  await page.waitForSelector('.cup .stage.live', { timeout: 30000 })
  await wait(700)
  await swipe(page, '.cup canvas', -220, 140)
  await wait(1900)
  await swipe(page, '.cup canvas', 300, 160)
  await wait(2200)
  await swipe(page, '.cup canvas', -140, 420)
  await wait(900)

  // Back up onto the closed shutter, then the credit card fades in over it.
  await glide(page, 0, 1400)
  await page.evaluate(() => {
    const card = document.createElement('div')
    card.innerHTML = `<img src="${document.querySelector('.coin img').currentSrc}" alt="" style="width:46%">
      <p class="display" style="font-size:30px;line-height:1.1">Κατασκευή Site και A/I εργαλείων</p>
      <p class="mono" style="font-size:14px;letter-spacing:.08em;color:#c9972a">από Akos DS · Θεοδωρή Ι. Μαύρο</p>`
    Object.assign(card.style, { position: 'fixed', inset: 0, zIndex: 99998, display: 'grid', placeContent: 'center', justifyItems: 'center', gap: '18px', padding: '0 28px', textAlign: 'center', background: 'rgb(11 11 11 / 94%)', color: '#faf6f0' })
    document.body.appendChild(card)
    card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' })
  })
  await wait(2100)
  const end = now()
  await wait(300)
  console.log(`frames: ${frames.length}, take ${(end - start).toFixed(1)}s, video ${((end - start) / SPEED).toFixed(1)}s`)

  // ---------- encode ----------
  const lines = ['ffconcat version 1.0']
  const first = Math.max(0, frames.findLastIndex(f => f.t <= start))
  for (let i = first; i < frames.length && frames[i].t < end; i++) {
    const a = Math.max(frames[i].t, start), b = Math.min(frames[i + 1]?.t ?? end, end)
    if (b - a > 0.001) lines.push(`file '${frames[i].file}'`, `duration ${(b - a).toFixed(4)}`)
  }
  lines.push(lines.at(-2)) // the concat demuxer drops the last entry's duration unless the file is repeated
  const list = join(TMP, 'frames.txt')
  writeFileSync(list, lines.join('\n'))
  const silent = join(TMP, 'silent.mp4')
  const ffmpeg = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', `setpts=PTS/${SPEED},fps=30,scale=1080:1920:flags=lanczos,setsar=1`,
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', silent])
  const secs = (end - start) / SPEED
  const beat = join(TMP, 'beat.wav')
  execFileSync('python3', [join(ROOT, 'demo/beat.py'), beat, secs.toFixed(2)], { stdio: 'inherit' })
  ffmpeg(['-i', silent, '-i', beat, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
    '-movflags', '+faststart', join(OUT, 'blessed-reel.mp4')])
  console.log(`done: ${join(OUT, 'blessed-reel.mp4')}`)
} finally {
  await browser.close()
}
