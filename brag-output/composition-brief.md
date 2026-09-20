# Hyperframes Composition Brief: Blessed Coffee & Spirits

## Objective
Create a short, moody launch/promo video for Blessed Coffee & Spirits (blessed.cafe), a real
coffee-and-cocktail bar at Rodou 68, Kato Patisia, Athens — plus a second, independently reflowed
vertical port for IG Reels/Stories. Both share the same plan, copy, timing, beat-locks, and audio;
only per-scene layout changes between them.

## Output
- Landscape composition directory: `composition/` → renders to `../brag.mp4`
- Vertical composition directory: `composition-vertical/` → renders to `../brag-vertical.mp4`
- Landscape format: 1920×1080
- Vertical format: 1080×1920
- Duration (both): 23.40s

## Source Material
- Project root: `/home/akos/blessedcoffee`
- Primary files read: `index.html`, `src/App.jsx` (real copy, palette, menu data, translations),
  `public/*` (real photography, logo, delivery-platform logos, real drone footage)
- Product name: Blessed Coffee & Spirits
- Tagline / strongest claim (verbatim, real site copy): "A taste of heaven in every cup." /
  "Γεύση απ' τον Παράδεισο σε κάθε ποτήρι."
- Key UI or visual moment to recreate: the site's own real desktop hero layout (a half-frame real
  photo beside a text panel) and the site's own real black-background / gold-accent CTA treatment
  (header, hero, dark menu page, footer all share this register)
- Copy that must appear verbatim:
  - "A taste of heaven in every cup."
  - "Γεύση απ' τον Παράδεισο σε κάθε ποτήρι."
  - "RODOU 68 · KATO PATISIA · ATHENS 104 45"
  - "MON–SAT 06:00–22:00 · SUN 07:00–22:00"
  - "211 218 1815"
  - "OR ORDER VIA" (adapted from the real `orderVia` string "Or Order Via")
  - "@blessedcoffee2024"
  - Real menu items: "Freddo Espresso", "Cappuccino", "Ελληνικός", "Mojito", "Daiquiri",
    "Bubble Blessed"

## Creative Direction
- Tone preset: `cinematic`
- Creative direction: a real neighborhood coffee-and-cocktail bar's launch reel, played with
  hospitality-trailer seriousness — moody, warm, real photography only, no invented claims
- Interpretation: dramatic wide reveals and confident holds, dialed back from "blockbuster/epic"
  since this is a real 2-year-old local business — no grandiose language, only the site's own real
  copy; gold-on-black lifted directly from the site's real header/hero/menu/footer palette
- Angle: see `brag-plan.md` → "The angle" (one bar, two real identities: espresso by day, cocktails
  by night, tied together by the one real logo)
- Hook: real drone footage of the cafe's own street, grounding the video in a real place before
  any branding appears
- Outro / punchline: real logo, gold hairline, then the real address/hours/phone/delivery/Instagram
  as one settled, readable card — held long enough to pause on
- Avoid:
  - Generic SaaS/startup language (this is a cafe, not a product)
  - Abstract filler visuals — every scene uses a real photo, the real logo, or real drone footage
  - Any invented menu item, price, review, or claim not present in `src/App.jsx` / `index.html`
  - Grandiose "epic/blockbuster" claims-language despite the `cinematic` tone preset

## Visual Identity
- Background: `#000000` (site's real header/hero/menu-page/footer background)
- Secondary background: `#FAF6F0` (site's cream content-section background; used sparingly if at
  all — the video stays in the site's own "hero mode" black/photo register)
- Accent (gold): `#C9972A`
- Text on black: `#FFFFFF` and `#EDE0CE`
- Text on cream (if used): `#2C1A0E` / `#3D2B1F`
- Display font: Playfair Display (400/600/700 incl. italic) — self-host or `@font-face` a local
  copy per `hyperframes-core` lint rule (`font_family_without_font_face`); do not rely on a runtime
  Google Fonts fetch
- Body/label font: Barlow Semi Condensed (300–700), always uppercase + letter-spaced for
  labels/buttons, matching the real site's own treatment exactly
- Visual references from the project (copied into `assets/img/` and `assets/` in both composition
  dirs):
  - `assets/img/background.webp` — real interior triptych (1920×960), includes the real logo
    printed on the actual takeaway cup
  - `assets/img/hero-left.webp` — real espresso-machine photo (640×960, portrait)
  - `assets/img/hero-right.webp` — real cocktail-pour photo (640×960, portrait)
  - `assets/img/blessed-logo.webp` — real logo, transparent (1024×1024)
  - `assets/img/efood-logo.webp`, `assets/img/wolt-logo.webp`, `assets/img/box-logo.png` — real
    delivery-platform logos exactly as used on the site (note: `box-logo.png` is only 102×80 —
    keep it small in the delivery row, don't scale it up beyond the site's own ~56px display size)
  - `assets/vid.mp4` — real aerial drone footage of the cafe's own street/square, 720×1280,
    24.57s, h264/30fps (only the first ~3.3s is used)

## Storyboard
Use the full storyboard in `brag-plan.md` as the creative contract — scene text, timing, and
audio-coupled moments are specified there per scene. Summary:

1. Hook / Establishing — 3.27s (0.00–3.27s) — real drone footage + location label
2. Reveal — 5.47s (3.27–8.74s) — real interior triptych + real logo + real bilingual tagline
3. Coffee — 4.37s (8.74–13.11s) — real espresso photo half-frame + 3 real menu items, one by one
4. Spirits — 4.36s (13.11–17.47s) — real cocktail photo half-frame (mirrored) + 3 real cocktail
   names, one by one
5. Outro / CTA — 6.13s (17.47–23.40s) — real logo, real address/hours/phone, real delivery logos,
   real Instagram handle, final bell on full settle

### Vertical-specific reflow (see `brag-plan.md` → "Reflow notes for the vertical port")
- Scene 1: `vid.mp4` is native portrait (720×1280) — full-bleed, no crop compromise.
- Scene 2: `background.webp` is a wide triptych (1920×960) — reflow as a vertical stack of its
  three real panel crops (equal thirds) instead of cropping two panels away.
- Scenes 3–4: the half-frame side-by-side split becomes a top-half-photo / bottom-half-text stack
  (same real photos, already portrait-shaped, so no new crop needed).
- Scene 5: same content, taller vertical spacing between logo / info card / delivery row / handle
  instead of a wide horizontal card.

## Audio
- Audio role: cinematic support, restrained
- Audio arc: quiet fade-in under Scene 1 → steady 0.30 bed through Scenes 2–4 → slight ducking
  under the two bell hits → fade-out under the final ~0.6s tail
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (already copied into
  both `composition/assets/music/` and `composition-vertical/assets/music/`)
- Music treatment: fade in ~1s, bed volume 0.30, ducks to ~0.20 for ~0.5s under each bell hit, then
  restores; final fade-out over the last ~0.6s
- Music cue guidance: bundled preset at
  `<skill-dir>/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`
  (`<skill-dir>` = `~/.claude/plugins/marketplaces/brag/skills/brag`). Every scene cut in the
  storyboard already lands exactly on a listed strong cue (3.27 / 8.74 / 13.11 / 17.47 / 22.93s,
  all ≥0.98 intensity) — no further nudging needed, these are exact matches, not approximations.
- Audio-reactive treatment: **subtle, deterministic simplification** — key the logo glow / gold
  hairline opacity to the same precomputed beat-grid timestamps already driving the cuts (small
  GSAP pulses at each beat in Scenes 2 and 5 only), rather than extracting live RMS/frequency data.
  Documented as a deliberate `ponytail:` simplification in `brag-plan.md` — acceptable because the
  only ask is "let the gold glow breathe with the beat," which the known, fixed beat grid already
  answers exactly. Do not add waveform/equalizer visuals, strobing, or heavy pulsing.
- Audio-coupled moments:
  - Scene 2 — logo scale-in at 3.30s — SFX `assets/sfx/impact/impactBell_heavy_000.ogg`
    (beat-locked: 3.27s cue)
  - Scenes 3 & 4 — each of the 3+3 menu-item pops — soft `assets/sfx/interface/drop_001.ogg` (or a
    `ui/click_*` if it reads cleaner against the drop already chosen for Scene 1's label — pick one
    family and stay consistent across both scenes)
  - Scene 5 — full CTA card fully settled at 22.93s — SFX
    `assets/sfx/impact/impactBell_heavy_003.ogg` (beat-locked: 22.93s cue, intensity 1.00)
- SFX selection guidance: `cinematic` posture from `audio.md` — 2-3 big moments (the two bells),
  quiet consistent pops for the two one-by-one lists, nothing else
- SFX analysis guidance: prefer low/medium HF-risk files for the repeated menu-item pops (see
  `<skill-dir>/assets/sfx/sfx-analysis.md`); the two bells are isolated one-off hits so their
  HF-risk matters less
- Exact SFX choice / timestamps: Hyperframes should finalize exact per-item pop timestamps once the
  actual pop animation timing is implemented — the plan specifies the moment type and family, not
  frame-exact numbers for every pop
- Audio files: already copied into `composition/assets/` and `composition-vertical/assets/`
  (`music/`, `sfx/impact/`, `sfx/interface/`) — do not re-copy from the skill dir, reference the
  local copies with paths relative to each composition directory

## Hyperframes Instructions
Load `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`,
`hyperframes-cli`. This is a `/brag` handoff — do not enter the generic `hyperframes` entry-point
intent interview or its generic promo/launch-video workflow.

Requirements:
- Show real UI/copy/visuals from the source project in every scene (no abstract filler) — already
  guaranteed by the storyboard above.
- Keep all text readable per the reading-time floor in `step-2-plan.md` (short label ~0.8s settled,
  sentence ~0.3s/word) — the outro card in particular carries real, must-be-correct information
  (address/hours/phone), so do not compress its holds to make room for anything else.
- Keep both videos at 23.40s total.
- Include the planned music/SFX layer as specified above.
- Treat the beat-lock timestamps above as exact scene-cut targets, not approximations to search
  around — they were chosen to already land on strong cues.
- Build `composition/` (landscape, 1920×1080) and `composition-vertical/` (1080×1920) as two
  separate Hyperframes projects sharing the same copy/timing/audio per the reflow notes above —
  they are not the same file resized, each scene's DOM layout differs per the reflow spec.
- Run `npx hyperframes check` in each composition directory before render — it is brag's single
  gate, run it twice (once per format).

The brief is the boundary: product positioning, copy, tone, source material, and moment selection
are specified above; concrete DOM structure, GSAP mechanics, exact per-pop SFX timestamps, and
render workflow are Hyperframes' to decide.
