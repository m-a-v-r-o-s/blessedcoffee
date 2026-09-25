// Posts the next queued item from social/publish/queue.json to Instagram,
// then advances the queue. Run on a schedule by
// .github/workflows/social-publish.yml (twice a week). Node's native
// fetch, no SDK. Uses the Instagram API with Instagram Login (no Facebook
// Page involved), so Facebook posting is not done here.
//
// Required env:
//   IG_ACCESS_TOKEN   - 60-day Instagram user token with
//                       instagram_business_basic + instagram_business_content_publish.
//                       Renewed weekly by .github/workflows/ig-token-refresh.yml.
//   IG_USER_ID        - the Instagram professional account id
//   GITHUB_REPOSITORY - "owner/repo", set automatically in Actions;
//                       export it by hand for a local test run.
//
// Media is served straight from the repo (it's public) via
// raw.githubusercontent.com, so there's no upload step: Meta's servers
// fetch image_url themselves.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Bump periodically, Meta deprecates Graph API versions on a schedule.
const GRAPH = 'https://graph.instagram.com/v26.0';

const { IG_ACCESS_TOKEN, IG_USER_ID, GITHUB_REPOSITORY } = process.env;
for (const [name, val] of Object.entries({ IG_ACCESS_TOKEN, IG_USER_ID, GITHUB_REPOSITORY })) {
  if (!val) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

const statePath = `${ROOT}/social/publish/state.json`;
const queue = JSON.parse(readFileSync(`${ROOT}/social/publish/queue.json`, 'utf8'));
const state = JSON.parse(readFileSync(statePath, 'utf8'));

const id = queue[state.cursor % queue.length];
const imageUrl = `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/social/library/${id}.jpg`;
const caption = readFileSync(`${ROOT}/social/library/${id}.txt`, 'utf8').trim();

async function graphPost(path, params) {
  const body = new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN });
  const res = await fetch(`${GRAPH}/${path}`, { method: 'POST', body });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Graph API error on ${path}: ${JSON.stringify(data.error || data)}`);
  }
  return data;
}

// Two-step publish: create a media container, then publish it.
console.log(`Posting "${id}" to Instagram...`);
const container = await graphPost(`${IG_USER_ID}/media`, { image_url: imageUrl, caption });
await graphPost(`${IG_USER_ID}/media_publish`, { creation_id: container.id });

state.cursor = (state.cursor + 1) % queue.length;
writeFileSync(statePath, JSON.stringify({ cursor: state.cursor }, null, 2) + '\n');
console.log(`"${id}" posted. Queue advanced to position ${state.cursor}.`);
