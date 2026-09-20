# Backdrop prompts still needed

7 posts in `social/render.mjs` are still "bg pending" (their `html()` renders fine today with no
background, marked with a `// bg pending:` comment above the post). `christmas` used to be on this
list but got a real photo of the actual decorated shop instead, real always beats generated.
`hiring` and `hiring-driver` are intentionally excluded, they stay plain on purpose, not pending.

Sourcing is deliberately mixed now, not just AI: either run a prompt below through an image
generator by hand, or drop in a real stock photo you've curated yourself that fits the same brief
(anonymous central-Athens neighbourhood texture, no recognisable landmark, no readable text, no
people, portrait orientation, roughly 4:5). Either source gets the same scrim treatment in the
card, the point is staying textural backdrop, never a documentary shot standing in for the shop's
own photography.

Save the result into `social/plates/` (any of .webp/.jpg/.png work), then wire it into the
matching post via `plate('filename')` the same way `bougatsa` and `beer` do, and re-render.

## `old-school` (Greek/filter/NES coffee card)

A photorealistic documentary style photograph of a cheerful Greek street kiosk (periptero) painted
in fresh warm colours, on a sunny central Athens neighbourhood street, blue sky, clean pavement,
colourful awnings. Portrait orientation, roughly 4:5 aspect ratio. Anonymous, generic Athens
architecture, no famous landmark, no monument, no recognisable building, no readable signage,
brand names or text, no people. Bright, positive, inviting daytime mood, like a real photograph,
not an illustration, not cartoonish or garish.

## `atmosphere-neighbourhood`

A photorealistic documentary style photograph of a narrow central Athens neighbourhood street at
midday, colorful ochre and terracotta apartment facades, blue shutters, a bougainvillea plant
spilling over a balcony, clear blue sky, warm cheerful light. Portrait orientation, roughly 4:5
aspect ratio. Anonymous, generic Athens architecture, no famous landmark, no monument, no
recognisable building, no readable signage or text, no people. Bright, positive, inviting mood,
like a real photograph, not an illustration, not cartoonish or garish.

## `atmosphere-early` (06:00 / before sunrise)

A photorealistic documentary style photograph of a central Athens neighbourhood square in early
morning golden light, sun flare through tree leaves, clean pastel-coloured buildings, a few wooden
benches, clear sky. Portrait orientation, roughly 4:5 aspect ratio. Anonymous, generic Athens
architecture, no famous landmark, no monument, no recognisable building, no readable signage or
text, no people. Bright, cheerful, inviting morning mood, like a real photograph, not an
illustration, not cartoonish or garish.

## `new-year`

A photorealistic documentary style photograph of an empty central Athens neighbourhood street just
after midnight in winter, quiet and calm. Streetlights glowing warm, a few lit apartment windows,
ordinary Greek apartment buildings (polykatoikies) with balconies, parked scooters, worn pavement,
wet street reflecting light after rain. Portrait orientation, roughly 4:5 aspect ratio. Anonymous,
generic Athens architecture, no famous landmark, no monument, no recognisable building, no readable
signage or text, no people, no visible license plates. Muted, slightly desaturated color grade,
like a real photograph, not an illustration, not cartoonish or garish. A sense of quiet new
beginning, nothing overtly celebratory like fireworks or confetti.

## `easter`

A photorealistic documentary style photograph of a central Athens neighbourhood street in spring,
daytime, soft warm sunlight. Ordinary Greek apartment buildings with balconies, some potted plants
and greenery on balconies, laundry lines, worn pavement, warm light. Portrait orientation, roughly
4:5 aspect ratio. Anonymous, generic Athens architecture, no famous landmark, no monument, no
recognisable building, no readable signage or text, no people, no visible license plates. Muted,
slightly desaturated color grade, like a real photograph, not an illustration, not cartoonish or
garish. A calm, hopeful spring morning mood, nothing overtly religious or symbolic beyond natural
spring light and greenery.

## `summer`

A photorealistic documentary style photograph of a central Athens neighbourhood street in summer,
bright daylight, strong warm sunlight and hard shadows. Ordinary Greek apartment buildings with
balconies and shutters, awnings casting shade, dry heat haze, worn pavement, maybe a parked scooter
in shade. Portrait orientation, roughly 4:5 aspect ratio. Anonymous, generic Athens architecture,
no famous landmark, no monument, no recognisable building, no readable signage or text, no people,
no visible license plates. Vivid but natural color grade, like a real photograph, not an
illustration, not cartoonish or garish. A bright, warm, unmistakably summer atmosphere.

## `apokries` (Carnival)

A photorealistic documentary style photograph of a central Athens neighbourhood street in late
winter, early evening, warm streetlights just turning on against a dim blue sky. Ordinary Greek
apartment buildings with balconies, narrow street, worn pavement, a faint sense of energy and
movement in the empty street. Portrait orientation, roughly 4:5 aspect ratio. Anonymous, generic
Athens architecture, no famous landmark, no monument, no recognisable building, no readable
signage or text, no people, no visible license plates, no confetti or costumes. Muted, slightly
desaturated color grade, like a real photograph, not an illustration, not cartoonish or garish. A
lively but understated end-of-winter mood.
