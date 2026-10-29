// node social/publish.test.mjs  (no network, no credentials)
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { orthodoxEaster, pick } from './publish.mjs';

const read = (f) => JSON.parse(readFileSync(new URL(`./publish/${f}`, import.meta.url), 'utf8'));
const cfg = (state = {}) => ({ queue: read('queue.json'), schedule: read('schedule.json'), state });
const iso = (d) => d.toISOString().slice(0, 10);

// Orthodox Easter, checked against the published dates.
assert.equal(iso(orthodoxEaster(2025)), '2025-04-20');
assert.equal(iso(orthodoxEaster(2026)), '2026-04-12');
assert.equal(iso(orthodoxEaster(2027)), '2027-05-02');
assert.equal(iso(orthodoxEaster(2028)), '2028-04-16');

// Greetings go out on their day even when it isn't a posting day, once per year.
assert.equal(pick('feed', '2026-12-25', cfg()).id, 'christmas'); // a Friday
assert.equal(pick('feed', '2027-05-02', cfg()).id, 'easter');
assert.equal(pick('feed', '2027-03-15', cfg()).id, 'clean-monday'); // 48 days before Easter 2027
assert.equal(pick('feed', '2027-03-25', cfg()).id, 'march-25');
assert.equal(pick('feed', '2026-12-25', cfg({ greetings: { christmas: 2026 } })), null);

// Off days post nothing; rotation days advance the cursor.
assert.equal(pick('feed', '2026-10-02', cfg()), null); // Friday
const r = pick('feed', '2026-10-01', cfg({ cursor: 3 })); // Thursday, October: no season
assert.equal(r.id, read('queue.json')[3]);
assert.equal(r.next.cursor, 4);

// In season, a seasonal post takes the slot, then waits 14 days before the next one.
const s1 = pick('feed', '2026-12-03', cfg()); // Thursday
assert.equal(s1.id, 'winter-espresso');
const s2 = pick('feed', '2026-12-07', cfg(s1.next)); // 4 days later: rotation
assert.equal(s2.id, read('queue.json')[0]);
const s3 = pick('feed', '2026-12-17', cfg(s2.next)); // 14 days later
assert.equal(s3.id, 'winter-cappuccino');
// January is still the 2026 winter: nothing seasonal left to post.
assert.equal(pick('feed', '2027-01-04', cfg(s3.next)).id, read('queue.json')[1]);
// Next winter the pair comes round again.
assert.equal(pick('feed', '2027-12-02', cfg(s3.next)).id, 'winter-espresso');

// Stories: a morning and an evening rotation, each with its own cursor; seasonal extras join the
// evening one. Food stories never go out in the evening (it sells out by noon).
const { stories, seasons: { winter } } = read('schedule.json');
assert.equal(pick('story', '2026-10-01', cfg()).id, stories.morning[0]);
assert.equal(pick('story', '2026-10-01', cfg(), 'evening').id, stories.evening[0]);
const am = pick('story', '2026-10-01', cfg({ storyCursor: { evening: 5 } }));
assert.deepEqual(am.next.storyCursor, { morning: 1, evening: 5 });
assert.equal(pick('story', '2026-10-01', cfg({ storyCursor: { morning: stories.morning.length } })).id, stories.morning[0]);
assert.equal(pick('story', '2026-12-10', cfg({ storyCursor: { evening: stories.evening.length + winter.stories.length } }), 'evening').id, 'ph-christmas');
const FOOD = /^ps-(peinirli|pies|craving|sesame|snack|window)(-2)?$/;
for (const id of stories.evening) assert.ok(!FOOD.test(id), `food story in the evening: ${id}`);
assert.equal(stories.morning.indexOf('story-quiz-espresso'), stories.evening.indexOf('story-quiz-answer'));

// Every scheduled id resolves to a real file.
const has = (id) => ['library', 'library-reels'].some((d) => existsSync(new URL(`./${d}/${id}.${d === 'library' ? 'jpg' : 'mp4'}`, import.meta.url)))
  || existsSync(new URL(`./library/${id}-1.jpg`, import.meta.url));
const { greetings, seasons } = read('schedule.json');
for (const id of [...read('queue.json'), ...greetings.map((g) => g.id), ...Object.values(seasons).flatMap((s) => s.feed)]) assert.ok(has(id), `missing feed media: ${id}`);
for (const id of [...stories.morning, ...stories.evening, ...Object.values(seasons).flatMap((s) => s.stories)])
  assert.ok(existsSync(new URL(`./library-stories/${id}.jpg`, import.meta.url)), `missing story: ${id}`);

console.log('publish: all checks passed');
