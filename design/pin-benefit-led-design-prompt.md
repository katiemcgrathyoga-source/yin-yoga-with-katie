> Paste everything below the line into Claude (design/artifact mode) as a single message,
> and attach:
>
> 1. `design/pose-data-pack.md` — all 42 poses with target areas, hold times and Katie's
>    own benefit copy. Without this it will invent benefits.
> 2. The six photos in `design/pin-photo-kit/` — one per crop archetype (lying, upright
>    lunge, seated, kneeling forward-fold, legs-up-wall, prop-supported).
> 3. 2–3 screenshots of the current pins, so it can see what it's replacing.
>
> Note: an artifact **cannot load images from a URL** (strict CSP), and it can't reference
> your uploads either. The attached photos are for Claude to *look at* while designing the
> crops; the artifact itself should draw photo areas as labelled placeholder blocks with a
> focal-point marker. Real photos are composited later by `netlify/functions/lib/pin.mjs`,
> which already loads them from the live site.

---

# Brief: benefit-led Pinterest pin templates for Yin Yoga with Katie

You are designing a new set of Pinterest pin templates for **Yin Yoga with Katie**
(yinyogawithkatie.com) — a yin yoga teacher with a YouTube channel, a free pose
library, and paid courses. Deliverable is a **design spec artifact**, not production
code (implementation notes below).

## The problem to solve

The current pins are **feature-led**: a photo of the pose plus the pose name
("Sleeping Swan"). Nobody searches Pinterest for "Sleeping Swan" — they search for
*tight hips after running*, *can't sleep*, *lower back pain from sitting all day*.
The pin has to answer the searcher's problem in the first half-second, at thumbnail
size, before the pose name matters at all.

**Redesign the templates so the benefit is the headline and the pose name is a
subordinate label.** Every template must work for three content types:

1. **Single pose** (42 pose pages) — one photo, one benefit
2. **Sequence / routine** (3–8 poses, with hold times)
3. **Course landing page** — *Runner's Reset* (live) and *Desk Reset for office
   workers* (in production)

## Copy system (design to this hierarchy)

Every pin carries four layers. Design the type scale so they read in this order:

| Layer | Job | Example | Weight in the design |
|---|---|---|---|
| **Audience tag** | Who this is for — self-selection | `FOR RUNNERS` · `IF YOU SIT ALL DAY` · `FOR BEGINNERS` | Small, all-caps, tracked-out eyebrow |
| **Benefit headline** | The outcome or the pain | "Tight hips after every long run" · "Unlock hips that sitting locked up" | **Dominant. Biggest thing on the pin.** |
| **Proof / mechanism** | Why it works, makes it credible | "3 minutes, one pose, no warm-up needed" · "Hold 3 min each side" | Mid-size supporting line |
| **Identifier** | What it actually is | "Sleeping Swan · a yin yoga pose" · "20-minute routine" | Small, quiet, near the wordmark |

Copy rules: no emoji; sentence case for headlines (never all-caps headlines);
no exclamation marks; second person ("your hips", not "the hips"); Katie's voice is
calm and plain — no hype, no "unlock your best self". Headline max ~7 words, and it
must still be legible when the pin is 236px wide.

Write **3 example headline sets per template** using this content so the layouts are
tested against real copy lengths (short, medium, and one that's uncomfortably long):

- Pose: *Sleeping Swan* — benefit: opens the outer hip and glute; audience: runners
- Pose: *Melting Heart* — benefit: undoes a day hunched at a desk; audience: office workers
- Routine: *20-minute Yin for tight hamstrings* — 5 poses with hold times
- Course: *Runner's Reset* — free 10-minute post-run routine, email capture
- Course: *Desk Reset* — for people who sit 8 hours a day

## Brand system — these are fixed, do not invent new ones

**Palette** (use these exact hex values, no additions):

| Token | Hex | Use |
|---|---|---|
| Oat | `#F9F1EA` | primary light ground |
| Card | `#FDF8F2` | inset panels, lightest ink on dark |
| Sage | `#48544C` | primary dark ground, ink on light |
| Rosewood | `#89494B` | accent — eyebrows, numerals on light |
| Quartz | `#BC9D9A` | accent — eyebrows, numerals on dark |
| Line | `#E4DACF` | hairlines, borders |
| Muted | `#6E756F` | secondary text on light |
| Ink | `#2E342F` | body text |
| Wash | `#F0E4E2` | blush ground (quote/soft pins) |

Every template ships in a **light colourway (oat ground / sage ink)** and a **dark
colourway (sage ground / oat ink)** from the same layout.

**Type** — only these three:
- **Cormorant Garamond** (light display serif, weight 500) — headlines, numerals
- **Cabin SemiBold** — eyebrows, sublines, hold times, the wordmark
- **Aurellie Calestion** (script) — *only ever* for the signed word "katie". Never
  for a headline, a label, or anything else. This is a hard rule.

**Wordmark**: `yinyogawithkatie.com` in Cabin, letter-spaced, present on every pin.

**Photography rules**: Katie's head and heart area must stay centred in every crop —
never crop the head, never crop so the face sits under text. Assume `object-fit:
cover` with a per-photo focal point. Photos are calm, natural light, oat/sage room.

In the artifact, **draw photo areas as placeholder blocks** in Line `#E4DACF` — labelled
with the crop ratio and a marked focal point — rather than embedding real images. The
attached photos are your reference for what actually fits each crop: check every layout
against all six (a standing lunge and a legs-up-the-wall shot need very different crop
windows), and say which archetypes each template suits and which it can't take.

## Format & technical constraints

- **1000 × 1500 px (2:3)**. Design at that ratio.
- Templates are rendered server-side with **Satori** (JSX → SVG), so the layout must
  live inside Satori's supported subset:
  - **Flexbox only** — no CSS grid, no float, no `position: sticky`
  - `position: absolute` is fine; so are `border-radius`, `linear-gradient`
    backgrounds, `object-fit`/`object-position` on images, opacity, hairline borders
  - No CSS filters, no blend modes, no masks, no SVG clip paths, no web effects that
    need a browser engine
  - No text effects beyond colour — no gradients on text, no outlines, no shadows
  - Text can't auto-shrink to fit: **every layout needs a defined overflow behaviour**
    (state the max character count each text slot tolerates)
- Everything is driven by props, so state each template's parameter list:
  `{ tone, eyebrow, headline, subline, identifier, image, focal, items[], footer }`

## What to design — 6 templates, each with a distinct job

Give each a name, its job, when Katie should reach for it, and both colourways:

1. **Benefit hook (photo-led)** — full-bleed photo, scrim, benefit headline over it.
   The highest-reach creative. Must survive a busy photo behind the type.
2. **Benefit card (text-led, no photo)** — for benefits with no good photo, and for
   quote-like statements. Must be the loudest pin in a feed at 236px.
3. **Problem → poses (numbered)** — benefit headline on top, 3–6 poses with hold
   times and small thumbnails beneath. The "save this" workhorse.
4. **Split (benefit + pose)** — benefit and pose photo share the canvas; the pose is
   clearly labelled without competing with the headline.
5. **Course pin** — for Runner's Reset / Desk Reset. Needs a free-offer line and an
   implied call to action, without looking like an ad.
6. **Before/after-state pin** — names the state now and the state after
   ("legs like concrete → legs that move"). One layout, must not look gimmicky.

Design one or two more if you see a job these miss, but say what job it does.

## Thumbnail proof (required)

Pinterest shows pins at roughly **236px wide** in feed. For every template, render a
**236px-wide version beside the full-size one** in the artifact. If the benefit
headline isn't readable at 236px, the design has failed — fix it rather than
shipping it. Call out explicitly which text layers survive at thumbnail size and
which are "detail only, for people who already clicked."

## Deliverable

A **single self-contained HTML artifact**, dark/light-theme aware, containing:

1. A one-paragraph rationale for the redesign direction
2. Each template rendered at full size in **both colourways**, with real example copy
3. The 236px thumbnail proof row for all templates
4. Per template: job, when to use, prop list, character limits per text slot,
   overflow behaviour
5. A **copy formula cheat-sheet** — how Katie writes the audience tag, benefit
   headline, proof line and identifier for a new pose, routine or course, with a
   filled example for each of the five content items listed above
6. A short "what changed and why" note comparing old (pose-name-led) to new
   (benefit-led)

Use the real palette and type names throughout, and keep the artifact itself in the
brand's visual language — this doubles as the handoff document.
