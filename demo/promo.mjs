// node demo/promo.mjs: a 1080x1920 Instagram reel of the whole site, cut on the beat from demo/beat.py.
// One shop day: the shutter rolls up, quick shots of every part of the site (shops, bean to cup,
// Faith over fear, the 3D cup, reviews, menu, a shop page, the order sheet), then the shutter comes
// back down and the credit sits on it. Each shot is a window of Chromium's screencast; whatever happens
// between windows (page loads, repositioning) never makes the cut.
// Default BASE is a local `astro preview --port 3002` (npm run build first); BASE=https://www.blessed.cafe for live.
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
const BEAT = 60 / 90 // beat.py's tempo; every cut lands on a beat
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`
const now = () => Date.now() / 1000
const wait = ms => new Promise(r => setTimeout(r, ms))
mkdirSync(OUT, { recursive: true })

// Finger dot, since headless capture shows no finger: it follows the pointer while pressed.
// Cookie choice pre-set so the banner stays away.
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
    const lift = () => {
      const d = dot; dot = null
      d?.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 }], { duration: 400, easing: 'ease-out' }).finished.then(() => d.remove())
    }
    addEventListener('pointerup', lift, true)
    addEventListener('pointercancel', lift, true)
  })
}

// Eased glide to a y offset, or to an element centred (plus dy), in a fixed time so shots are predictable.
const glide = (page, target, ms, dy = 0) => page.evaluate(([target, ms, dy]) => new Promise(done => {
  const from = scrollY
  let to = target
  if (typeof target !== 'number') {
    const r = document.querySelector(target).getBoundingClientRect()
    to = r.top + scrollY - (innerHeight - r.height) / 2
  }
  to += dy
  const t0 = performance.now()
  const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / ms)
    scrollTo({ top: from + (to - from) * ease(p), behavior: 'instant' })
    p < 1 ? requestAnimationFrame(step) : done()
  }
  requestAnimationFrame(step)
}), [target, ms, dy])
const jump = (page, target, dy) => glide(page, target, 1, dy)

// Off camera after each load: every photo loaded and decoded, so no shot opens on an empty frame.
const open = async (page, path) => {
  await page.goto(BASE + path, { waitUntil: 'load' })
  await page.evaluate(() => Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}) })))
}

// A real touch fling sideways across a scroll-snap rail, so momentum and snapping are the browser's own.
async function fling(cdp, page, selector, dx) {
  const b = await page.locator(selector).boundingBox()
  cdp.send('Input.synthesizeScrollGesture', { x: Math.round(b.x + b.width * (dx < 0 ? 0.8 : 0.2)), y: Math.round(b.y + b.height / 2), xDistance: dx, yDistance: 0, speed: 1400, gestureSourceType: 'touch' }).catch(() => {})
}

// Eased slide of a rail to its nth card, on the main thread: a fling on a photo rail scrolls on the
// compositor ahead of raster and the screencast catches blank tiles. Snap is off while it moves.
const slide = (page, selector, n, ms) => page.evaluate(([selector, n, ms]) => new Promise(done => {
  const rail = document.querySelector(selector), from = rail.scrollLeft
  const to = rail.children[n].offsetLeft - rail.children[0].offsetLeft
  const t0 = performance.now()
  const ease = t => 1 - (1 - t) ** 3
  rail.style.scrollSnapType = 'none'
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / ms)
    rail.scrollLeft = from + (to - from) * ease(p)
    if (p < 1) return requestAnimationFrame(step)
    rail.style.scrollSnapType = ''
    done()
  }
  requestAnimationFrame(step)
}), [selector, n, ms])

// Horizontal drag across the middle of an element, dx px over ms, then lift (fast = a flick).
async function swipe(page, selector, dx, ms) {
  const b = await page.locator(selector).boundingBox()
  const x = b.x + b.width / 2 - dx / 2, y = b.y + b.height * 0.55, steps = Math.round(ms / 16)
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x + dx * (1 - (1 - i / steps) ** 2), y)
    await wait(ms / steps)
  }
  await page.mouse.up()
}

async function tap(page, selector) {
  const b = await page.locator(selector).first().boundingBox()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await page.mouse.down(); await wait(70); await page.mouse.up()
}

// ---------- run ----------

// Real GPU through ANGLE on Vulkan: on SwiftShader the cup renders at a few fps.
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist'] })
try {
  const ctx = await browser.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 1080 / 405, isMobile: true, hasTouch: true })
  await ctx.addInitScript(overlay)
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)

  // Warm the cache on every page in the cut (photos, three.js, the cup label).
  for (const path of ['/menu', '/patisia']) {
    await page.goto(BASE + path, { waitUntil: 'load' })
    await jump(page, 'footer'); await wait(800)
  }
  await page.goto(BASE, { waitUntil: 'load' })
  for (const s of ['.shops', '.bean', '.faith', '.reviews', '.cup .stage']) { await jump(page, s); await wait(300) }
  await page.waitForSelector('.cup .stage.live', { timeout: 30000 })

  const frames = []
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = join(TMP, String(frames.length).padStart(6, '0') + '.jpg')
    writeFileSync(file, Buffer.from(data, 'base64'))
    frames.push({ file, t: metadata.timestamp })
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920 })

  // A shot keeps exactly `beats` beats of screen from when it starts, however long its action takes.
  const shots = []
  const shot = async (beats, action) => {
    await wait(500) // off camera: lazy photos decode after a jump
    const start = now(), len = beats * BEAT
    await action()
    const left = start + len - now()
    if (left > 0) await wait(left * 1000)
    else console.warn(`shot ${shots.length + 1} ran ${(-left).toFixed(2)}s long, cut early`)
    shots.push([start, start + len])
  }

  await open(page, '/') // not reload: that restores the scroll and opens on the cup
  await jump(page, 0)
  const shut = await page.evaluate(() => document.querySelector('.hero').offsetHeight - innerHeight)
  await wait(600)

  // 1. Opening: the closed shutter rolls up on the shop, the logo coin sways in.
  await shot(5, async () => { await wait(450); await glide(page, shut * 0.8, 2300) })
  // 2. The two shops.
  await jump(page, '.shops .cards', 160)
  await shot(2, () => glide(page, '.shops .cards', 1200, -40))
  // 3. Bean to cup: along the rail.
  await jump(page, '.bean .rail', -60)
  await shot(2, async () => { await wait(150); await slide(page, '.bean .rail', 2, 900) })
  // 4. Faith over fear: the photo drifts as it passes.
  await jump(page, '.faith .split', -220)
  await shot(2, () => glide(page, '.faith .split', 1300, 120))
  // 5. The cup: it turns with the scroll as it comes in, then two flicks round its printed sides.
  await jump(page, '.cup .stage', 220)
  await shot(6, async () => {
    await glide(page, '.cup .stage', 900)
    await wait(150)
    await swipe(page, '.cup canvas', -230, 140)
    await wait(1250)
    await swipe(page, '.cup canvas', 300, 160)
  })
  // 6. Reviews: fling through the quotes.
  await jump(page, '.reviews .quotes', -60)
  await shot(2, async () => { await wait(150); await fling(cdp, page, '.reviews .quotes', -700) })
  // 7. The menu.
  await open(page, '/menu')
  await shot(2, () => glide(page, '.sections', 1250, -120))
  // 8. Patisia's page.
  await open(page, '/patisia')
  await shot(2, () => glide(page, '.facts', 1100, -60))
  // 9. Order: the sheet springs up from the header button.
  await shot(2, async () => { await wait(200); await tap(page, '.hdr .order') })
  // 10. Closing: the shutter comes back down, the credit goes on it, both lines one size.
  await open(page, '/')
  await jump(page, shut * 0.8)
  await shot(4, async () => {
    await glide(page, 0, 1000)
    await page.evaluate(() => {
      const card = document.createElement('div')
      card.innerHTML = `<img src="${document.querySelector('.coin img').currentSrc}" alt="" style="width:46%">
        <p class="display" style="font-size:32px;line-height:1.1">Κατασκευή Site και A/I εργαλείων<br>
        <span style="color:#c9972a">από Θεοδωρή Ι. Μαύρο<br>Akos DS</span></p>`
      Object.assign(card.style, { position: 'fixed', inset: 0, zIndex: 99998, display: 'grid', placeContent: 'center', justifyItems: 'center', gap: '22px', padding: '0 24px', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 50%, rgb(11 11 11 / 92%) 30%, rgb(11 11 11 / 55%) 100%)', color: '#faf6f0' })
      document.body.appendChild(card)
      card.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' })
    })
  })
  await wait(300)
  await cdp.send('Page.stopScreencast')
  const secs = shots.reduce((s, [a, b]) => s + b - a, 0)
  console.log(`frames: ${frames.length}, ${shots.length} shots, video ${secs.toFixed(2)}s`)

  // ---------- encode ----------
  // Each shot holds every frame that was on screen during its window, for as long as it was on screen.
  const lines = ['ffconcat version 1.0']
  for (const [start, end] of shots) {
    const first = Math.max(0, frames.findLastIndex(f => f.t <= start))
    for (let i = first; i < frames.length && frames[i].t < end; i++) {
      const a = Math.max(frames[i].t, start), b = Math.min(frames[i + 1]?.t ?? end, end)
      if (b - a > 0.001) lines.push(`file '${frames[i].file}'`, `duration ${(b - a).toFixed(4)}`)
    }
  }
  lines.push(lines.at(-2)) // the concat demuxer drops the last entry's duration unless the file is repeated
  const list = join(TMP, 'frames.txt')
  writeFileSync(list, lines.join('\n'))
  const silent = join(TMP, 'silent.mp4')
  const ffmpeg = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', 'fps=30,scale=1080:1920:flags=lanczos,setsar=1',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', silent])
  const beat = join(TMP, 'beat.wav')
  execFileSync('python3', [join(ROOT, 'demo/beat.py'), beat, secs.toFixed(2)], { stdio: 'inherit' })
  ffmpeg(['-i', silent, '-i', beat, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
    '-movflags', '+faststart', join(OUT, 'blessed-reel.mp4')])
  console.log(`done: ${join(OUT, 'blessed-reel.mp4')}`)
} finally {
  await browser.close()
}
