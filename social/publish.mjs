// Posts the next queued item from social/publish/queue.json to Instagram
// and Facebook, then advances the queue. Run on a schedule by
// .github/workflows/social-publish.yml (twice a week). Node's native
// fetch, no SDK.
//
// Required env:
//   PAGE_ACCESS_TOKEN     - Page access token with pages_manage_posts +
//                           instagram_content_publish
//   PAGE_ID               - the Facebook Page id
//   IG_BUSINESS_ACCOUNT_ID - the linked IG Business account id
//   GITHUB_REPOSITORY     - "owner/repo", set automatically in Actions;
//                           export it by hand for a local test run.
//
// Media is served straight from the repo (it's public) via
// raw.githubusercontent.com, so there's no upload step: Meta's servers
// fetch image_url/url themselves.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Bump periodically, Meta deprecates Graph API versions on a schedule.
const GRAPH = 'https://graph.facebook.com/v21.0';

const { PAGE_ACCESS_TOKEN, PAGE_ID, IG_BUSINESS_ACCOUNT_ID, GITHUB_REPOSITORY } = process.env;
for (const [name, val] of Object.entries({ PAGE_ACCESS_TOKEN, PAGE_ID, IG_BUSINESS_ACCOUNT_ID, GITHUB_REPOSITORY })) {
  if (!val) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

const statePath = `${ROOT}/social/publish/state.json`;
const queue = JSON.parse(readFileSync(`${ROOT}/social/publish/queue.json`, 'utf8'));
const state = JSON.parse(readFileSync(statePath, 'utf8'));
state.posted ||= {};

const id = queue[state.cursor % queue.length];
const imageUrl = `https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/social/library/${id}.jpg`;
const caption = readFileSync(`${ROOT}/social/library/${id}.txt`, 'utf8').trim();

async function graphPost(path, params) {
  const body = new URLSearchParams({ ...params, access_token: PAGE_ACCESS_TOKEN });
  const res = await fetch(`${GRAPH}/${path}`, { method: 'POST', body });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Graph API error on ${path}: ${JSON.stringify(data.error || data)}`);
  }
  return data;
}

// Two-step publish: create a media container, then publish it.
async function publishToInstagram() {
  const container = await graphPost(`${IG_BUSINESS_ACCOUNT_ID}/media`, { image_url: imageUrl, caption });
  await graphPost(`${IG_BUSINESS_ACCOUNT_ID}/media_publish`, { creation_id: container.id });
}

async function publishToFacebook() {
  await graphPost(`${PAGE_ID}/photos`, { url: imageUrl, caption });
}

function save() {
  writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
}

// Persist after each platform, not just at the end, so a failure on one
// platform (network blip, rate limit) doesn't re-post to the platform
// that already succeeded on the next scheduled run.
const already = state.posted[id] || {};

if (!already.ig) {
  console.log(`Posting "${id}" to Instagram...`);
  await publishToInstagram();
  already.ig = true;
  state.posted[id] = already;
  save();
  console.log('  done.');
}

if (!already.fb) {
  console.log(`Posting "${id}" to Facebook...`);
  await publishToFacebook();
  already.fb = true;
  state.posted[id] = already;
  save();
  console.log('  done.');
}

delete state.posted[id];
state.cursor = (state.cursor + 1) % queue.length;
save();
console.log(`"${id}" posted to both platforms. Queue advanced to position ${state.cursor}.`);
