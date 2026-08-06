# Reply to Claude Design's questions

**Attach with this reply, from `C:\yin-site\design\pin-review\`:**

The eight missing template renders —
`06-offer-light.jpg`, `06-offer-dark.jpg`, `07-states-light.jpg`,
`07-states-dark.jpg`, `08-video-light.jpg`, `08-video-dark.jpg`,
`09-window-light.jpg`, `09-window-dark.jpg`

And the clean photographs from `design\pin-review\photos\` — all 11.

Then paste everything below the horizontal rule.

---

Answers in order.

**The four missing renders** — attached: Offer, Before → after, Watch with me and
Window, both colourways. Don't reconstruct anything from the brief; the JPEGs are
the ground truth.

**How to show "as it is now"** — the actual renderer JPEGs, pasted in at scale. An
HTML recreation would be your reading of the current state, and any drift between
the recreation and the real render makes the comparison lie about what changed.
Mismatched frames are a cheaper problem than a dishonest before.

**Photographs for the revised side** — attached separately, clean and type-free,
11 of them. These are the exact files the renderer uses: `squat` and `camel` are
the high-resolution portrait crops the Benefit hook and Split read, the rest are
the standard crops. All are pre-centred on the subject, which is why the
horizontal focal is always 50% — please keep it there.

**How far to go** — confident. New elements where they earn it. A tight pass on
ratios and spacing is what has already been done, so repeating it would produce
very little. Two conditions on anything new: it has to survive the 236px feed
row, and it has to be buildable from the property list in the brief.

**The Benefit card** — two or three directions for it, one resolved revision for
everything else. It is the open problem; the other seven need resolving, not
exploring.

**Type ratios** — one modular scale that all eight inherit. Eight templates that
share a scale read as one system in a feed, which is the whole point; the current
inconsistency is exactly what per-template tuning produced.

One thing to watch: the character limits in the brief are *derived* from the
current sizes, not independent of them. The 19-character state line is one line
at 108px; the 40-character headline is three lines at 112px on the hook. **If the
scale moves a size, say so explicitly and give me the new size** — I will
re-measure the limits and re-cut the copy. Don't quietly change a size and leave
the limit as written, or headlines will start overflowing the canvas.

**The 236px row** — revised and current, stacked. That comparison is the thing
that decides whether any of this was worth doing.

**What already bothers me about the eight**

Specific irritations, most annoying first:

1. **The Window's lower block is mostly void.** The proof line sits at the top of
   it and the identifier at the bottom, with a large empty gap between. It is
   `justify-content: space-between` applied across more height than the content
   needs, and it reads as an accident rather than as air.

2. **The dense pose list wastes its middle.** Eight rows are vertically centred in
   a tall flex area, so there is dead space above and below the block. It is the
   most-used routine pin and the least composed.

3. **The Offer leaves a sliver of photograph visible either side of the card.**
   The card is inset 64px and the photo band runs behind it, so two thin strips
   of image show above the card's shoulders. It looks like a z-fight, not a
   decision. Either commit to the overlap or hide it.

4. **The Benefit hook's veil eats the bottom of the photograph.** At 0.97 opacity
   against the bottom edge, Katie's shins disappear on the light version. The
   type needs the contrast, but the trade is currently too far toward the type.

5. **The Watch-with-me badge and tag are unstyled.** A rounded rectangle with a
   run time in it, and caps over a scrim. They are the plainest objects in the
   system and they sit on the template whose job is a click.

6. **The Before → after separator is a dot between two rules.** It replaced an
   arrow glyph that Satori silently failed to render. It works, but it is the
   least considered mark in the set and it carries the whole device.

7. **The Offer's call-to-action pill is quartz on sage in the dark colourway** —
   the one element on the one template that has to convert, and it has the
   weakest contrast of anything in the system.
