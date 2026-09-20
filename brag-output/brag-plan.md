# Brag Plan: Blessed Coffee & Spirits

## What is this app?
A real coffee bar in Kato Patisia, Athens (Rodou 68) that runs specialty coffee by day and
cocktails/spirits by night, alongside fresh pastries — the site's own name says exactly what it
is: "Coffee & Spirits."

## The angle
Don't invent a gimmick — the business already has a built-in creative hook: one bar, two
identities (espresso bar by day, cocktail bar by night), tied together by one real logo (praying
hands over a coffee cup, "Est. 2024"). The video is a short, moody walk from "this is a coffee
shop" to "and also a bar" to "here's exactly where and when," using only real interior photos,
the real logo, the real tagline, and the real menu names already on the site.

## Hook (first 2-3 seconds)
Real aerial drone footage of the actual Kato Patisia square the cafe sits on (`vid.mp4`, shot for
the site's own hero), pushed in slightly, dark cinematic grade. A small tracked label fades up:
"RODOU 68 · KATO PATISIA · ATHENS" — grounding the video in a real place before anything else.

## Key moments (the middle)
- The real interior triptych photo (`background.webp`: espresso machine → barista pouring into a
  cup printed with the actual logo → cocktail shaker pour) revealed wide, with the real logo mark
  and the real hero tagline "A taste of heaven in every cup." (+ its Greek line, since the site is
  genuinely bilingual) landing over it.
- Coffee side: the real espresso-machine photo (`hero-left.webp`) as a half-frame panel (this
  mirrors the site's own desktop hero layout, which splits the screen into side photos), with real
  menu names popping in one by one: Freddo Espresso, Cappuccino, Ελληνικός.
- Spirits side: the real cocktail-pour photo (`hero-right.webp`) as the mirrored panel, with real
  cocktail names from the menu popping in: Mojito, Daiquiri, Bubble Blessed.

## Outro / punchline
Cut to black (the site's own header/footer color). The real logo lands center, a gold hairline
draws under it (the site's own divider treatment), then the real address, real hours, real phone
number, and the real delivery-platform logos (e-food, Wolt, Box) settle in as one clean card — the
exact information a viewer would act on. Final beat: a soft bell rings as the whole card is fully
settled, held long enough to be paused on and read.

## User flow worth showing
None — landing-page/marketing site only (a cafe, not a web app). The strongest real material is
the site's own hero photography, real logo, real bilingual tagline, and real menu/contact facts
(Step 1 Q3–Q4), which the storyboard below is built around.

## Tone
- Preset: `cinematic`
- Creative direction: "a small neighborhood coffee-and-cocktail bar's launch reel, played with the
  same seriousness as a hospitality trailer — moody, warm, real photography, no invented claims"
- Interpretation: dramatic wide reveals and confident holds (per `cinematic`), but dialed back from
  "epic/blockbuster" language since this is a real 2-year-old local business, not a startup — no
  grandiose claims, only the site's own real copy. Big type, full-bleed real photos, slow
  pushes/reveals, gold-on-black accents lifted straight from the site's own header/footer/menu-page
  palette.

## Format & duration
Two deliverables from one shared plan/story, each with its own composition (scene layouts reflowed
per aspect ratio, same copy/timing/beat-locks/audio):
1. **Landscape** — 1920×1080 (`brag-output/composition/` → `brag-output/brag.mp4`)
2. **Vertical** (IG Reels/Stories) — 1080×1920 (`brag-output/composition-vertical/` →
   `brag-output/brag-vertical.mp4`)

Duration: 23.4s (within 15-25s law; the outro card carries genuinely more real information —
address, hours, phone, 3 delivery platforms, Instagram — so it gets the longest hold).

## Visual identity (from the project)
- Background: `#000000` (site's real header/hero/menu-page/footer background)
- Secondary background: `#FAF6F0` (cream, site's content-section background) — used sparingly, the
  video stays mostly on the black/photo register since that's the site's own "hero mode" palette
- Accent (gold): `#C9972A`
- Text on black: `#FFFFFF` / `#EDE0CE` (cream, matches the site's own no-JS fallback text color)
- Text on cream: `#2C1A0E` (site's `text`), `#3D2B1F` (site's `darkBrown`)
- Display font: **Playfair Display** (400/600/700, incl. italic) — site's real headline/tagline
  font
- Body/label font: **Barlow Semi Condensed** (300–700) — site's real nav/button/label font, always
  uppercase + tracked in the real site, same treatment here
- Strongest visual elements: `background.webp` (real interior triptych incl. the actual branded
  cup), `hero-left.webp` / `hero-right.webp` (real half-frame hero photos), `blessed-logo.webp`
  (real logo, transparent), `vid.mp4` (real drone footage of the actual street/square)

## Share copy (draft)
Blessed Coffee & Spirits — Rodou 68, Kato Patisia. Specialty coffee by day, cocktails after dark.
Open daily from 06:00.

## Audio direction
- Role: cinematic support, restrained
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady/clean, tempo ~109.96 BPM
  — bundled cue preset read from `<skill-dir>/assets/music/cues/…music-cues.json|md`)
- Music treatment: fade in over first ~1s, bed at 0.30 under all scenes, ducks slightly under the
  final bell, fades out over the last ~0.6s
- Music cue guidance: bundled preset used. Every scene cut in the storyboard below lands exactly on
  a listed strong cue (3.27 / 8.74 / 13.11 / 17.47 / 22.93s — all ≥0.98 intensity) rather than an
  approximate nearby time, so no further nudging is needed. `22.93s` (intensity 1.00) is reserved
  for the final logo-card bell.
- Audio-reactive treatment: **simplified, documented deliberately** — rather than full RMS/frequency
  extraction, the logo glow and gold divider opacity are keyed directly to the same precomputed
  beat-grid timestamps already used for cuts (a handful of tiny GSAP pulses at beat times in the
  reveal and outro scenes only). This is deterministic and avoids a live audio-extraction pipeline
  for a video whose only audio-reactive ask is "let the gold glow breathe a little with the beat."
  `ponytail: beat-grid-driven pulse, not true RMS-reactive; upgrade to real extraction if a future
  cut needs the glow to track dynamics the fixed beat grid doesn't capture.`
- SFX posture: sparse, 2-3 big moments plus quiet per-item pops for the two menu lists
  (`cinematic` posture from `audio.md`)
- Audio-coupled moments: logo landing (Scene 2), each menu-item pop (Scenes 3 & 4), final
  logo-card bell (Scene 5)
- Restraint rule: no waveform/equalizer graphics, no strobing, no more than 1 bell-family hit per
  scene, nothing louder than the music bed except the two bell moments

## Storyboard

### Scene 1 — Hook / Establishing — 3.27s (0.00–3.27s)
Real aerial drone footage of the cafe's own street/square (`vid.mp4`), slow push-in, dark
cinematic grade (matches the site's own darkened hero treatment, `brightness(0.55)`). A small
gold, tracked, uppercase label fades up low on frame at 0.5s, settled by 1.3s, holds to scene end:
"RODOU 68 · KATO PATISIA · ATHENS."
Sequential/interaction: none
Audio intent: quiet, atmospheric, music fading in under a real place
Audio-coupled idea: none (music fade-in only)
Music: fade in, bed ~0.30
Transition mood: dramatic wipe → Scene 2 (beat-locked: cut at 3.27s)

### Scene 2 — Reveal — 5.47s (3.27–8.74s)
Cut wide to the real interior triptych (`background.webp`: espresso machine → cup pour with the
real logo visible on the cup → cocktail shaker), slow Ken-Burns zoom-out. The real logo
(`blessed-logo.webp`) scales in centered, small, at 3.3s. Below it, Playfair Display italic:
"A taste of heaven in every cup." fades/rises in, settled by ~4.8s, holds to 8.5s. A smaller
second line beneath in the same italic treatment: "Γεύση απ' τον Παράδεισο σε κάθε ποτήρι." (the
site's own real Greek line — it's a genuinely bilingual business).
Sequential/interaction: none (single reveal, not a list)
Audio intent: the emotional high point of the open — warm, confident landing
Audio-coupled idea: logo scale-in → SFX `impactBell_heavy_000` at 3.30s (beat-locked: 3.27s cue)
Music: bed continues ~0.30
Transition mood: dramatic wipe → Scene 3 (beat-locked: cut at 8.74s)

### Scene 3 — Coffee — 4.37s (8.74–13.11s)
Half-frame split (recreates the site's own real desktop hero layout): left half is the real
espresso-machine photo (`hero-left.webp`), darkened; right half is solid black carrying text. Gold
tracked label "SPECIALTY COFFEE" lands first, then three real menu items pop in one by one, each
held to the readable floor: "Freddo Espresso" → "Cappuccino" → "Ελληνικός."
Sequential/interaction: yes — 3 menu-item lines pop in one by one, ~0.9s apart, each settled before
the next arrives
Audio intent: warm, tactile, morning-bar energy
Audio-coupled idea: each item pop → soft `ui/click_001` (or `interface/drop_001`); first pop
snapped near a beat-grid point, not forced to exactly every beat
Music: bed continues ~0.30
Transition mood: clean crossfade (mirrored wipe) → Scene 4 (beat-locked: cut at 13.11s)

### Scene 4 — Spirits — 4.36s (13.11–17.47s)
Mirrored half-frame: right half is the real cocktail-pour photo (`hero-right.webp`), darkened;
left half is solid black carrying text. Gold tracked label "& SPIRITS AFTER DARK" (the site's own
name is literally "Coffee & Spirits" — this is the site's real duality, not an invented claim),
then three real cocktail names pop in: "Mojito" → "Daiquiri" → "Bubble Blessed."
Sequential/interaction: yes — same one-by-one pop pattern as Scene 3, mirrored side, for visual
rhyme
Audio intent: slightly darker, more evening/moody than Scene 3
Audio-coupled idea: same soft click/drop family as Scene 3, kept consistent
Music: bed continues ~0.30
Transition mood: dramatic wipe to black → Scene 5 (beat-locked: cut at 17.47s)

### Scene 5 — Outro / CTA — 6.13s (17.47–23.40s, incl. tail)
Full black (site's real header/footer color). Real logo (`blessed-logo.webp`) scales in larger,
centered, ~17.5–18.3s. A gold hairline draws under it. Then, as one settled card: real address
("RODOU 68 · KATO PATISIA · ATHENS 104 45"), real hours ("MON–SAT 06:00–22:00 · SUN 07:00–22:00"),
real phone ("211 218 1815") fade in together ~18.3–19.3s and hold. Real delivery-platform logos
(e-food, Wolt, Box, exactly as shown on the real site) fade in as a row under the label "OR ORDER
VIA" (the site's own real copy) ~19.6–20.4s and hold. Real Instagram handle "@blessedcoffee2024"
settles last, ~20.6s. Everything holds fully visible and readable from ~20.6s to 22.93s.
Sequential/interaction: yes — logo, then info block, then delivery row, then handle; each a single
block-level reveal, not a fast list
Audio intent: quiet confident landing, the "beat before the logo" moment the outro law asks for
Audio-coupled idea: full card fully settled → SFX `impactBell_heavy_003` at 22.93s (beat-locked:
22.93s cue, intensity 1.00, the strongest cue in the whole window); music ducks slightly under it
then fades out over the final ~0.6s tail to 23.40s
Music: fades out under the final bell
Transition mood: hold, then cut to black (end)

**Music mood for this video:** cinematic
**Audio summary:** one steady, clean cinematic bed at low volume throughout, two bell moments (the
logo landing in Scene 2, the full CTA card landing in Scene 5) each locked to the strongest nearby
beat in the bundled cue preset, quiet click/drop pops on the two one-by-one menu-item reveals, no
other decoration.

## Reflow notes for the vertical (1080×1920) port
Same plan, copy, timing, beat-locks, and audio — only the per-scene layout changes:
- Scene 1: `vid.mp4` is native 720×1280 (portrait) — fills the vertical frame edge-to-edge with no
  crop-to-sliver problem at all (the opposite of the landscape version, which has to crop it).
- Scene 2: `background.webp` (1920×960, a wide triptych) cannot go full-bleed on a 1080×1920 canvas
  without cropping two of its three real panels away. Reflowed as a vertical stack of the same
  triptych's three real crops (espresso machine / cup pour with logo / cocktail shaker), each
  panel given equal vertical thirds, logo + tagline overlaid centered across the stack.
- Scenes 3 & 4: the "half-frame photo + half-frame text" split becomes top-half real photo /
  bottom-half black text panel (stacked, not side-by-side) — same real photos
  (`hero-left.webp`/`hero-right.webp`, already portrait 640×960, a natural fit for a top-half crop),
  same labels, same one-by-one item pops.
- Scene 5: unchanged in spirit — logo, then info card, then delivery row, then handle — just
  reflowed to the taller canvas with more vertical breathing room between blocks instead of a wide
  card.
