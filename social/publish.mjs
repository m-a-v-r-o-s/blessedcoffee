// Posts Blessed Coffee content to Instagram, run by .github/workflows/social-publish.yml.
//   node social/publish.mjs feed    daily: a greeting on its date, else the rotation on Mon/Thu
//   node social/publish.mjs story   twice a day: the next story
// Node's native fetch, no SDK. Instagram API with Instagram Login (no Facebook Page).
//
// What goes out is decided by pick() from three files in social/publish/:
//   queue.json     feed rotation. An id is a library/<id>.jpg image, a library-reels/<id>.mp4 reel,
//                  or a carousel when library/<id>-1.jpg, <id>-2.jpg ... exist.
//   schedule.json  greetings (fixed "MM-DD", or "easter" / "easter±N" for Orthodox Easter),
//                  seasons (months, extra feed posts and stories), and the story rotation.
//   state.json     cursors plus what already went out, written back by the workflow.
//
// Required env: IG_ACCESS_TOKEN, IG_USER_ID, GITHUB_REPOSITORY (set in Actions).
// Optional: DRY_RUN=1 prints what would be posted and posts nothing;
//           PUBLISH_DATE=YYYY-MM-DD pretends today is that day (Athens time otherwise).
// Media is served from the public repo (images via raw.githubusercontent.com, videos via jsDelivr);
// Meta fetches it itself.
// Stories via the API need a Business account (a Creator account gets an error).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = `${ROOT}/social/publish`;
// Bump periodically, Meta deprecates Graph API versions on a schedule.
const GRAPH = 'https://graph.instagram.com/v26.0';
const FEED_DAYS = [1, 4]; // Monday, Thursday
const SEASONAL_GAP_DAYS = 14; // seasonal feed posts replace a rotation slot at most this often

// Orthodox Easter (Julian computus + 13 days, valid 1900-2099) as a UTC date.
export function orthodoxEaster(y) {
  const a = y % 4, b = y % 7, c = y % 19;
  const d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7;
  const m = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
  return new Date(Date.UTC(y, m - 1, day + 13));
}

const iso = (d) => d.toISOString().slice(0, 10);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

function greetingDate(spec, year) {
  const m = spec.match(/^easter([+-]\d+)?$/);
  if (!m) return `${year}-${spec}`;
  const d = orthodoxEaster(year);
  d.setUTCDate(d.getUTCDate() + Number(m[1] || 0));
  return iso(d);
}

// Pure decision: what to post for this mode on this date. Returns { id, next } or null (nothing today).
export function pick(mode, today, { queue, schedule, state }) {
  const year = Number(today.slice(0, 4)), month = Number(today.slice(5, 7));
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const seasons = Object.entries(schedule.seasons).filter(([, s]) => s.months.includes(month));
  // Winter runs Dec-Feb, so Jan/Feb belong to the season that started the previous year.
  const seasonKey = (name) => `${name}-${month <= 2 ? year - 1 : year}`;
  const next = structuredClone(state);

  if (mode === 'story') {
    const pool = [...schedule.stories, ...seasons.flatMap(([, s]) => s.stories)];
    const cursor = state.storyCursor ?? 0;
    next.storyCursor = (cursor + 1) % pool.length;
    return { id: pool[cursor % pool.length], next };
  }

  const greeting = schedule.greetings.find((g) => greetingDate(g.date, year) === today);
  if (greeting && state.greetings?.[greeting.id] !== year) {
    next.greetings = { ...state.greetings, [greeting.id]: year };
    return { id: greeting.id, next };
  }
  if (!FEED_DAYS.includes(weekday)) return null;

  const gapOk = !state.lastSeasonal || days(state.lastSeasonal, today) >= SEASONAL_GAP_DAYS;
  for (const [name, s] of seasons) {
    const id = s.feed.find((f) => state.seasonal?.[f] !== seasonKey(name));
    if (id && gapOk) {
      next.seasonal = { ...state.seasonal, [id]: seasonKey(name) };
      next.lastSeasonal = today;
      return { id, next };
    }
  }

  const cursor = state.cursor ?? 0;
  next.cursor = (cursor + 1) % queue.length;
  return { id: queue[cursor % queue.length], next };
}

// ─── Instagram ───────────────────────────────────────────────────────────────
async function main() {
  const mode = process.argv[2];
  if (!['feed', 'story'].includes(mode)) throw new Error('Usage: node social/publish.mjs feed|story');
  const { IG_ACCESS_TOKEN, IG_USER_ID, GITHUB_REPOSITORY, DRY_RUN, PUBLISH_DATE } = process.env;
  for (const [name, val] of Object.entries({ IG_ACCESS_TOKEN, IG_USER_ID, GITHUB_REPOSITORY })) {
    if (!val && !DRY_RUN) throw new Error(`Missing required env var: ${name}`);
  }

  const read = (f) => JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));
  const state = read('state.json');
  const today = PUBLISH_DATE || new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Athens' });
  const choice = pick(mode, today, { queue: read('queue.json'), schedule: read('schedule.json'), state });
  if (!choice) return console.log(`${today}: no feed post today.`);

  const { id } = choice;
  const url = (path) => `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/social/${path}`;
  // raw.githubusercontent serves mp4 as application/octet-stream; jsDelivr mirrors the repo with
  // video/mp4. Pinned to the commit so a stale CDN copy can never be what gets posted.
  const videoUrl = (path) => `https://cdn.jsdelivr.net/gh/${GITHUB_REPOSITORY}@${process.env.GITHUB_SHA || 'main'}/social/${path}`;
  const caption = (path) => readFileSync(`${ROOT}/social/${path}`, 'utf8').trim();
  const slides = [];
  for (let n = 1; existsSync(`${ROOT}/social/library/${id}-${n}.jpg`); n++) slides.push(`library/${id}-${n}.jpg`);

  // Container params per kind. A carousel's children are created first, inside publish().
  let kind, params;
  if (mode === 'story') [kind, params] = ['story', { media_type: 'STORIES', image_url: url(`library-stories/${id}.jpg`) }];
  else if (existsSync(`${ROOT}/social/library-reels/${id}.mp4`))
    [kind, params] = ['reel', { media_type: 'REELS', video_url: videoUrl(`library-reels/${id}.mp4`), caption: caption(`library-reels/${id}.txt`), share_to_feed: 'true' }];
  else if (slides.length) [kind, params] = ['carousel', { media_type: 'CAROUSEL', caption: caption(`library/${id}-1.txt`) }];
  else [kind, params] = ['image', { image_url: url(`library/${id}.jpg`), caption: caption(`library/${id}.txt`) }];

  console.log(`${today}: ${kind} "${id}"${DRY_RUN ? ' (dry run, nothing posted)' : ''}`);
  if (DRY_RUN) return console.log(JSON.stringify({ params, slides: slides.map(url) }, null, 2));

  async function graph(path, body, method = 'POST') {
    const q = new URLSearchParams({ ...body, access_token: IG_ACCESS_TOKEN });
    const res = method === 'GET' ? await fetch(`${GRAPH}/${path}?${q}`) : await fetch(`${GRAPH}/${path}`, { method, body: q });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(`Graph API error on ${path}: ${JSON.stringify(data.error || data)}`);
    return data;
  }
  // Meta processes media asynchronously (videos can take minutes); publish only when FINISHED.
  async function ready(containerId) {
    for (let i = 0; i < 60; i++) {
      const { status_code } = await graph(containerId, { fields: 'status_code' }, 'GET');
      if (status_code === 'FINISHED') return;
      if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Container ${containerId} ${status_code}`);
      await new Promise((r) => setTimeout(r, 10_000));
    }
    throw new Error(`Container ${containerId} not ready after 10 minutes`);
  }

  if (kind === 'carousel') {
    const children = [];
    for (const s of slides) {
      const child = await graph(`${IG_USER_ID}/media`, { image_url: url(s), is_carousel_item: 'true' });
      await ready(child.id);
      children.push(child.id);
    }
    params.children = children.join(',');
  }
  const container = await graph(`${IG_USER_ID}/media`, params);
  await ready(container.id);
  await graph(`${IG_USER_ID}/media_publish`, { creation_id: container.id });

  // Saved only after a successful publish, so a failed run retries the same item next time.
  writeFileSync(`${DIR}/state.json`, JSON.stringify(choice.next, null, 2) + '\n');
  console.log(`"${id}" posted.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err.message); process.exit(1); });
}
