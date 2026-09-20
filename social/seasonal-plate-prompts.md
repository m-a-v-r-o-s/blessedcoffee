# Seasonal AI backdrop prompts

Prompts for the AI backdrop plates the 5 seasonal posts in `social/render.mjs` are waiting on
(their `html()` currently renders with no `bg`, same "bg pending" state as `old-school`,
`atmosphere-neighbourhood`, `atmosphere-early` and `hiring-driver`).

Run each prompt through an image generator by hand, save the result into `social/plates/` (e.g.
`athens-christmas-lights.webp`), then wire it into the matching post via `plate('filename')` the
same way `bougatsa` and `beer` do, and re-render.

Every prompt below already encodes the project rule: anonymous central-Athens neighbourhood
texture only, no recognisable landmark, no readable text, no people, documentary photographic
style, portrait orientation.

## Christmas (post id: `christmas`)

A photorealistic documentary style photograph of a narrow residential street in central Athens,
Greece, at dusk in winter. Warm string lights (fairy lights) strung between apartment balconies
overhead, typical Greek balcony railings and shutters, parked scooters, worn pavement. Soft golden
warm light mixed with cool blue twilight sky. Portrait orientation, roughly 4:5 aspect ratio. The
street should be anonymous, generic Athens neighbourhood architecture, no famous landmark, no
monument, no recognisable building, no readable signage or text, no people, no cars with visible
license plates. Muted, slightly desaturated color grade, like a real photograph, not an
illustration, not cartoonish, not over-saturated or garish. Subtle Christmas atmosphere through the
string lights alone, nothing overtly festive or decorated beyond that.

## New Year (post id: `new-year`)

A photorealistic documentary style photograph of an empty central Athens neighbourhood street just
after midnight in winter, quiet and calm. Streetlights glowing warm, a few lit apartment windows,
ordinary Greek apartment buildings (polykatoikies) with balconies, parked scooters, worn pavement,
wet street reflecting light after rain. Portrait orientation, roughly 4:5 aspect ratio. Anonymous,
generic Athens architecture, no famous landmark, no monument, no recognisable building, no readable
signage or text, no people, no visible license plates. Muted, slightly desaturated color grade,
like a real photograph, not an illustration, not cartoonish or garish. A sense of quiet new
beginning, nothing overtly celebratory like fireworks or confetti.

## Easter (post id: `easter`)

A photorealistic documentary style photograph of a central Athens neighbourhood street in spring,
daytime, soft warm sunlight. Ordinary Greek apartment buildings with balconies, some potted plants
and greenery on balconies, laundry lines, worn pavement, warm light. Portrait orientation, roughly
4:5 aspect ratio. Anonymous, generic Athens architecture, no famous landmark, no monument, no
recognisable building, no readable signage or text, no people, no visible license plates. Muted,
slightly desaturated color grade, like a real photograph, not an illustration, not cartoonish or
garish. A calm, hopeful spring morning mood, nothing overtly religious or symbolic beyond natural
spring light and greenery.

## Summer (post id: `summer`)

A photorealistic documentary style photograph of a central Athens neighbourhood street in summer,
bright daylight, strong warm sunlight and hard shadows. Ordinary Greek apartment buildings with
balconies and shutters, awnings casting shade, dry heat haze, worn pavement, maybe a parked scooter
in shade. Portrait orientation, roughly 4:5 aspect ratio. Anonymous, generic Athens architecture,
no famous landmark, no monument, no recognisable building, no readable signage or text, no people,
no visible license plates. Vivid but natural color grade, like a real photograph, not an
illustration, not cartoonish or garish. A bright, warm, unmistakably summer atmosphere.

## Apokries / Carnival (post id: `apokries`)

A photorealistic documentary style photograph of a central Athens neighbourhood street in late
winter, early evening, warm streetlights just turning on against a dim blue sky. Ordinary Greek
apartment buildings with balconies, narrow street, worn pavement, a faint sense of energy and
movement in the empty street. Portrait orientation, roughly 4:5 aspect ratio. Anonymous, generic
Athens architecture, no famous landmark, no monument, no recognisable building, no readable
signage or text, no people, no visible license plates, no confetti or costumes. Muted, slightly
desaturated color grade, like a real photograph, not an illustration, not cartoonish or garish. A
lively but understated end-of-winter mood.
