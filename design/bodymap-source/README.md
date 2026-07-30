# Body-map plates — source artwork

The nine full-resolution JPEGs in this folder are the originals behind
`public/bodymap/*.webp`, which is what the site actually serves. Keep these: the
webp files are cropped and recompressed, so they can't be edited back up.

## What the nine are

One pair of figures — a front view and a back view of the same body — in a set of
highlight states. Muscles not being worked stay dusty quartz pink; the ones this
session works are deep rosewood.

| File | Highlighted |
|---|---|
| `front-base.jpg` | nothing (all muted) |
| `front-hips.jpg` | hip flexors |
| `front-quads.jpg` | quadriceps |
| `front-all.jpg` | both |
| `back-base.jpg` | nothing (all muted) |
| `back-glutes.jpg` | glutes + hamstrings |
| `back-calves.jpg` | calves |
| `back-lumbar.jpg` | erector spinae (lower back) |
| `back-all.jpg` | all four |

`BodyMap.astro` pairs a front and a back plate per region — e.g. `calves` shows
`front-base` beside `back-calves`.

## Why they get processed

Two things have to be true or the pair looks wrong side by side:

1. **Identical crop.** All nine were generated from the same two base plates, so
   the figure sits in the same place in every file (bounding box `233,82 → 599,1166`).
   One shared crop keeps the figures aligned; cropping each to its own content
   would make the body jump between sessions.
2. **One cream.** Each generation drifts the background a few RGB points. Left
   alone, the front and back plates show a visible seam where they meet, so every
   file is shifted onto a single cream — `rgb(224,218,201)`, the same value the
   plate's CSS background uses in `BodyMap.astro`.

## Regenerating

Run from the repo root, with the nine JPEGs in this folder:

```js
// node -e "...", requires sharp (already a dependency via Astro)
const sharp = require('sharp'); const fs = require('fs');
const CROP = { left: 213, top: 62, width: 406, height: 1124 };
const TARGET = [224, 218, 201];
const dir = 'design/bodymap-source/';
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jpg'))) {
  const { data } = await sharp(dir + f).raw().toBuffer({ resolveWithObject: true });
  const off = [TARGET[0] - data[0], TARGET[1] - data[1], TARGET[2] - data[2]];
  await sharp(dir + f).extract(CROP).linear([1, 1, 1], off)
    .resize({ width: 320 }).webp({ quality: 88 })
    .toFile('public/bodymap/' + f.replace('.jpg', '.webp'));
}
```

If the plates are ever redrawn from scratch, re-measure the bounding box first —
`CROP` is specific to this set of figures.

## If you redraw them

They were produced in Grok Imagine. The things that were hard to get and are worth
knowing before you start again:

- Say **"diagram"**, not "illustration" — "illustration" produces a figure-drawing
  with collarbones, chest contours and knee definition.
- Demand a **flat, solid, featureless silhouette** explicitly, and list what that
  excludes. It will otherwise add body detail every time.
- The **hip flexors** are the hard part: they're anatomically contiguous with the
  quads, so the model keeps merging them into one shape. Specify a *small* shape
  *high on the hip* with a *wide gap* — describing the gap alone isn't enough.
- Say the **midline between the legs stays plain**, or it highlights the groin.
- **Few, bold fibre lines** (about five per muscle). Dense hatching looks better at
  full size and disappears entirely at the 130px the plates actually render at.
- Do highlight variants as **colour-only edits from the base plate**, never from a
  previously edited file, and keep the colour wording identical across all of them
  so the whole set lands on the same tone.
