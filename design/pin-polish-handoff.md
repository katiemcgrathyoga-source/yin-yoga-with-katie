> Paste everything below the line into Claude (design mode) as one message, and
> attach the 18 JPEGs in `design/pin-review/` — all eight templates, both
> colourways. Those are real renders from the production renderer, not mockups.

---

# Brief: visual polish pass on eight working Pinterest templates

You designed the original system for **Yin Yoga with Katie**. It has since been
built and shipped: eight templates rendering live at 1000 × 1500 through Satori,
feeding a daily pinning calendar. The attached images are what the renderer
actually produces today.

**This is not a redesign.** The templates work, the copy is locked, the layouts
are correct. What is missing is the last ten per cent — the detail that separates
a good pin from a beautiful one, which is the part your earlier set had and the
built version lost in translation.

## What to leave alone

Do not propose changes to any of these. They are settled and expensive to move.

- **The canvas**: 1000 × 1500, 2:3.
- **The eight templates and their jobs**: Benefit hook, Benefit card, Problem →
  poses, Split, Offer, Before → after, Watch with me, Window.
- **All copy**, and the character limits behind it — audience ≤22, headline ≤40,
  proof ≤54, state lines ≤19. The words are the client's voice and have been
  through review.
- **Which photo goes in which template.** Eligibility is computed from a measured
  subject extent per photograph; a wide pose physically cannot go in a portrait
  crop. Photos are pre-centred, so horizontal focal is always 50%.
- **The palette and type.** Oat `#F9F1EA`, Card `#FDF8F2`, Sage `#48544C`,
  Rosewood `#89494B`, Quartz `#BC9D9A`, Line `#E4DACF`, Muted `#6E756F`,
  Ink `#2E342F`. Cormorant Garamond 500 for display, Cabin 400/600 for
  everything else, and **Aurellie Calestion only ever for the signed word
  "katie"** — never a headline, never a label.

## What to change

Everything else about how these look. Specifically the things that make a pin
feel made rather than generated:

- **Scrims and gradients.** Where a gradient sits, how far it travels, how hard
  it lands, and what colour it is.
- **Framing.** Inner margins, hairline frames, whether an image is full-bleed or
  inset, corner radii.
- **Layering.** Chips, tabs and labels that overlap an edge; how a caption meets
  a photograph.
- **Rhythm.** The relationship between type sizes inside one pin, and the
  vertical spacing between blocks.
- **The signature.** Where "katie" appears, and on which templates.
- **Edges.** How a photograph ends — hard crop, soft fade, framed.

## Four things the client noticed, as a starting point

These are the specific gaps between your earlier set and the built one. Address
them, then go further.

1. **The scrim ignores the colourway.** The hook's gradient is the same dark
   green whether the pin is light or dark, so a "light" pin has a dark bottom
   third and stops belonging to its own colourway. Your earlier light hook used a
   pale veil rising into the photograph, which kept it in the oat world.
2. **The gradients are too short and too abrupt.** They read as a bar behind text
   rather than light falling off.
3. **The Split lost its frame.** Yours had an inset arch inside a hairline
   border with real margin. The built one is a full-bleed arch, which reads
   flatter and cheaper.
4. **Labels are plain text, not objects.** The pose name on the Split sits as
   bare type on a scrim. Yours was a small filled tab overlapping the arch — and
   the signature sat in the opposite corner, which balanced it.

## The technical envelope — this is the real constraint

These render through **Satori 0.26**, which is more capable than the original
spec claimed. My earlier brief said no masks, no filters, no clip paths, no text
effects. That was wrong, and it is why the built pins are plainer than they
needed to be. The full list:

**Available**
- Flexbox layout, absolute positioning, per-side borders, per-corner
  `border-radius`, `opacity`
- `linear-gradient`, `repeating-linear-gradient`, `radial-gradient`,
  `repeating-radial-gradient`, and `url()` backgrounds
- **`maskImage`** with a linear or radial gradient, plus `maskPosition` — so a
  photograph can fade into the ground instead of ending on a hard edge
- `boxShadow` (including inset), `textShadow`
- `filter`, `clipPath`, `WebkitTextStroke`
- 2D `transform` and `transformOrigin` — translate, rotate, scale, skew
- `textTransform`, `letterSpacing`, `lineHeight`

**Not available, and no way around it**
- Three-dimensional transforms
- **`z-index` does not exist.** Paint order is document order: a later element
  is always on top. Any layering you design has to work with that.
- `calc()` — every value must be a resolved number
- Kerning, ligatures and OpenType features
- Text cannot shrink to fit. A line that is too long overflows the canvas rather
  than wrapping smaller, which is why the character limits are hard.

Anything on the first list is fair game and none of it has been used except plain
linear gradients. Masks and inset shadows in particular are untouched.

## What to hand back

A **single self-contained HTML artifact**, theme-aware, containing:

1. Each of the eight templates as it is now, beside your refined version, at a
   size where the detail is visible. Both colourways where the change differs
   between them.
2. For every change, the **specific CSS property and value** — `boxShadow:
   'inset 0 0 0 1px rgba(...)'`, not "add a subtle inner glow". These get typed
   straight into a renderer, so a description costs a round trip.
3. A short note per template on *why* the change earns its place. If something
   is there for its own sake, cut it.
4. A 236px feed-size row of the refined set. Pinterest shows pins at thumbnail
   size; a refinement that only reads at full size is decoration.

Work in the brand's own visual language throughout — the artifact doubles as the
handoff document, and it is the thing that gets implemented from.
