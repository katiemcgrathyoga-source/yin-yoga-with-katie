# Handoff: visual polish pass

**How to use this file:** attach the 18 JPEGs in `design/pin-review/`, then paste
everything below the horizontal rule as one message. Nothing else is needed.

Regenerate the JPEGs first if the templates have changed since:
`node scripts/export-pins-for-review.mjs`

---

# Brief: a second visual pass on eight working Pinterest templates

You designed the original system for **Yin Yoga with Katie**. It has since been
built and shipped: eight templates rendering live at 1000 × 1500 through Satori,
feeding a daily pinning calendar. The attached images are exactly what the
renderer produces today — real photographs, real copy, real fonts.

**This is not a redesign.** The templates work and the layouts are correct. What
is wanted is the last ten per cent: the detail that separates a good pin from a
beautiful one.

## What has already been fixed — please don't redo these

A first polish pass landed four changes. They are in the attached images:

1. **The veil behind type on a photograph now follows the colourway.** It was a
   fixed dark green regardless of tone, so a "light" pin had a dark bottom third.
   It now uses the colourway's own ground, across six stops from the bottom edge
   to 86%.
2. **The Split's arch is inset, framed with a hairline, and lifted off the bottom
   edge**, with the pose name as a filled tab and the signature in the opposite
   corner.
3. **The Window's photograph dissolves into the ground at both edges** via a
   mask, instead of stopping on hairline rules.
4. **Before → after's photograph fades in at the top** the same way.

## Where to push

Everything else about how these look. In particular the things a first pass
corrects but a second pass invents:

- **Type relationships inside a single pin.** The sizes were set by eye. The
  ratio between headline, proof and identifier is probably not optimal on any of
  the eight.
- **The Benefit card.** It is the only template with no photograph and it has had
  the least attention — currently a hairline box and nothing else. It has to be
  the loudest pin in a feed.
- **The Offer.** The card lifted over the photo band is the busiest composition
  in the set and the one that has to convert.
- **The pose lists.** Two of them, five rows and eight rows. The dense one is
  the most-used routine pin and the least considered.
- **The Video.** The run-time badge and the audience tag over the photograph are
  the plainest elements in the whole system.
- **Radial gradients, `filter`, `clipPath`, `textShadow` and 2D transforms are
  all available and entirely unused.** So is inset `boxShadow`.

## What to leave alone

Settled, and expensive to move.

- **The canvas**: 1000 × 1500, 2:3.
- **The eight templates and their jobs**: Benefit hook, Benefit card, Problem →
  poses, Split, Offer, Before → after, Watch with me, Window.
- **All copy**, and the limits behind it — audience ≤22 characters, headline ≤40,
  proof ≤54, state lines ≤19. The words are the client's voice and have been
  through review.
- **Which photograph goes in which template.** Eligibility is computed from a
  measured subject extent per photo; a wide pose physically cannot go in a
  portrait crop. Photos are pre-centred, so the horizontal focal is always 50%.
- **Palette**: Oat `#F9F1EA`, Card `#FDF8F2`, Sage `#48544C`, Rosewood `#89494B`,
  Quartz `#BC9D9A`, Line `#E4DACF`, Muted `#6E756F`, Ink `#2E342F`.
- **Type**: Cormorant Garamond 500 for display, Cabin 400/600 for everything
  else, and **Aurellie Calestion only ever for the signed word "katie"** — never
  a headline, never a label.

## The technical envelope — the real constraint

These render through **Satori 0.26**. An earlier brief told you it supported no
masks, filters, clip paths or text effects. That was wrong, and it is why the
built pins were plainer than your design. The accurate list:

**Available**
- Flexbox, absolute positioning, per-side borders, per-corner `border-radius`,
  `opacity`
- `linear-gradient`, `repeating-linear-gradient`, `radial-gradient`,
  `repeating-radial-gradient`, `url()` backgrounds
- **`maskImage`** with linear or radial gradients, plus `maskPosition`
- `boxShadow` including inset, and `textShadow`
- `filter`, `clipPath`, `WebkitTextStroke`
- 2D `transform` and `transformOrigin` — translate, rotate, scale, skew
- `textTransform`, `letterSpacing`, `lineHeight`

**Not available**
- Three-dimensional transforms
- **`z-index` does not exist.** Paint order is document order — a later element
  is always on top. Any layering has to work with that.
- `calc()` — every value must be a resolved number, so gradient stops are
  percentages
- Kerning, ligatures, OpenType features
- Text cannot shrink to fit. An over-long line overflows the canvas rather than
  wrapping smaller, which is why the character limits are hard.

## What to hand back

A **single self-contained HTML artifact**, theme-aware, containing:

1. Each template as it is now beside your revision, large enough to judge. Both
   colourways wherever the change differs between them.
2. For every change, the **exact CSS property and value** — `boxShadow: 'inset 0
   0 0 1px rgba(...)'`, not "add a subtle inner glow". These get typed straight
   into a renderer; a description costs a round trip.
3. One line per template on why the change earns its place. If something is
   there for its own sake, cut it.
4. A 236px feed-size row of the revised set. Pinterest shows pins at thumbnail
   size, and a refinement that only reads at full size is decoration.

Work in the brand's own visual language — the artifact is the handoff document
and the thing that gets implemented from.
