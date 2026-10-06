# Blessed Coffee & Spirits

Website and marketing automation for Blessed Coffee & Spirits, a neighbourhood coffee shop and bar
at Rodou 68, Kato Patisia, Athens. Three parts live in this repo:

| Part | Where | Runs on |
| --- | --- | --- |
| Website (blessed.cafe) | `src/`, `public/` | Railway |
| AI replies to Google reviews | `reviews/` | GitHub Actions |
| Automated Instagram content and posting | `social/` | GitHub Actions |

## Website

React 19 + Vite single page site. Menu, prices and opening hours live in `src/App.jsx`; everything
else in the marketing automation copies its facts from there.

```
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run lint
```

Railway only redeploys when the site's own files change. Commits that touch only `reviews/` or
`social/` show as "Skipped, no changes to watched files", which is expected.

## AI review replies

`reviews/reply.mjs` answers new Google reviews of the café with a short owner reply drafted by
Claude (Sonnet 5.5). `.github/workflows/review-replies.yml` runs it on a cron (every 15 minutes).

How it behaves:

- Reads the location's reviews through the Google Business Profile API and answers the ones with no
  reply. "Unanswered" is read straight from Google, so there is no queue to maintain.
- Waits until a review is at least 13 minutes old, so replies never look instant, and only looks at
  the last 14 days, so it never mass-replies to old reviews by accident.
- Replies in the reviewer's language (Greek when there is no text), in the informal singular,
  1 to 3 short sentences. Low star reviews get an apology and an invitation to get in touch, with no
  admission of fault and no promises.
- A code check runs on every draft before it is posted. A draft that contains a link, an email, a
  phone number, or any promise of a freebie, discount or treat is never posted. The review is
  recorded in `reviews/skipped.json`, the run fails so GitHub emails the owner, and the review is
  left to be answered by hand in Google Maps. A draft that Claude declines or cuts short is handled
  the same way.
- At most 5 replies per run, so a loop cannot run up a bill.

Secrets (GitHub, Settings, Secrets and variables, Actions): `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `ANTHROPIC_API_KEY`. The refresh token comes from a
one-time sign-in: `node reviews/auth.mjs <client_secret.json>`. The Google Cloud project is
`akosds-business-profile`, and its Google My Business API access was approved by Google
(it is not listed in the public API library until a project is approved).

Run it by hand from the Actions tab (Google review replies, Run workflow):

- `dry_run`: print the drafts without posting anything. Do this first after any prompt change.
- `max_age_days` and `max_per_run`: for a one-off backlog, for example `3650` and `100`. With
  `max_age_days` above 14 it reads every page of reviews.

Test (offline, no network): `node reviews/reply.test.mjs`

## Automated social media

Instagram only (`@blessedcoffee2024`), run through the Instagram API with Instagram Login. Facebook
posting is not wired up. The content is generated as images and videos in this repo, then a
scheduled publisher posts them.

### Content

Everything is rendered from code with headless Chrome (`playwright-core`) so it can be regenerated
and diffed. Every price and time comes from `src/App.jsx`, never invented. Real photos only: no
AI-generated imagery.

| Script | Output |
| --- | --- |
| `node social/render.mjs [ids]` | Feed cards, 1080x1350, into `social/library/` with a caption `.txt` each |
| `node social/render-stories.mjs [ids]` | Stories, 1080x1920, into `social/library-stories/` |
| `node social/render-reels.mjs [ids]` | Reels (MP4, 1080x1920) built around the 3D cup, into `social/library-reels/` |
| `node social/cup/shots.mjs [ids]` | Posed transparent stills of the 3D cup (`social/cup/`) used by the cards |

The library is organised as recurring series, each on its own colour: **07:00** (early mornings),
**Στο μενού** (menu and prices), **Είπατε** (real Google reviews), seasonal coffee (hot espresso and
cappuccino in winter, freddos in summer), plus occasion greetings. Real photos are in
`social/photos/`; each photo backs one feed post, and stories may reuse photos with a different line.

### Publishing

`social/publish.mjs feed|story` decides what goes out and posts it. The decisions are a pure
function (`pick()`) fed by three files in `social/publish/`:

- `queue.json`: the feed rotation (an id is an image, a reel, or a carousel).
- `schedule.json`: greetings by date (including Orthodox Easter offsets), seasons, and the story
  rotation.
- `state.json`: cursors and what already went out. The workflow commits it back after each run.

`.github/workflows/social-publish.yml` runs a feed job daily at 06:00 UTC that posts on Mondays and
Thursdays (or on a greeting's own date, such as Christmas), and story jobs at 05:30 and 15:30 UTC.

Status: the publish workflow is **disabled** until the content library is ready, and has never
posted to the real API yet. Keep `ig-token-refresh.yml` enabled either way.

Dry run locally, nothing is posted:
`DRY_RUN=1 PUBLISH_DATE=2026-12-25 node social/publish.mjs feed`

Test: `node social/publish.test.mjs` (checks the schedule logic and that every referenced file exists;
the workflow runs it before publishing).

### Instagram token

The access token lasts 60 days. `.github/workflows/ig-token-refresh.yml` renews it every Sunday and
writes the new one back into the `IG_ACCESS_TOKEN` secret. If that workflow fails for 60 days the
token dies and has to be regenerated in the Meta developer dashboard. Secrets: `IG_ACCESS_TOKEN`,
`IG_USER_ID`, `IG_TOKEN_REFRESH_PAT`.

Media URLs handed to Instagram are served from this repository (images via raw.githubusercontent.com,
videos via jsDelivr), so the repo must stay public while the publisher is in use.

## Credits

Built by [Akos Digital Services](https://www.akosds.com).
