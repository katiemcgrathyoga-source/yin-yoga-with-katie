---
name: publish-post
description: Write and publish a weekly journal post on yinyogawithkatie.com — frontmatter, CTA routing, pin angles, the checks that matter, and the traps that fail silently. Use when writing, editing or shipping a blog/journal post, or a public routine to go with one.
---

# Publishing a journal post

One post a week. The writing is the hard part; everything below is the machinery
around it, and most of it fails *quietly* if you get it wrong.

## Where things live

```
src/content/blog/<slug>.md        the post
src/content/routines/<slug>.md    a public routine, if the post gives one away
src/content/poses/<slug>.md       poses the post links to (42 of them)
```

Schemas are in `src/content.config.ts` and the build enforces them. `npm run build`
runs `astro check` first, so a bad post fails the build rather than shipping broken.

## The three flags that decide visibility

| | renders at its URL | in /blog listing | in RSS | in sitemap | indexable |
|---|---|---|---|---|---|
| `draft: true` | no | no | no | no | — |
| `unlisted: true` | yes | no | no | no | no (noindex) |
| both false | yes | yes | yes | yes | yes |

**`unlisted` is the soft launch** — use it while a post is waiting on Katie's voice
pass. Publishing is then one line.

Two places have been wrong about this before, both now fixed, both worth
re-checking if you add a collection:

- `astro.config.mjs` excludes unlisted posts from the sitemap. Submitting a
  noindex page to Google is the contradiction that put 168 URLs in Search Console.
- `src/lib/pinInventory.ts` skips unlisted posts. Pinning a noindex page drives
  Pinterest traffic to a page we've told Google to ignore.

## Frontmatter that does something

Most fields are self-explanatory. These have behaviour attached:

- **`eyebrow_tag: "for runners"`** switches the end-of-post CTA from the free
  retreat to the **runner lead magnet**, which is the funnel with a product
  behind it. Any other value keeps the retreat. This is the single highest-value
  field on a runner post — see `src/pages/blog/[slug].astro`.
- **`practise: { routine, video, video_label }`** renders the practise-along block.
  `routine` is a slug in `src/content/routines/` and its page carries the timer;
  `video` is a YouTube id.
- **`faq`** renders on the page *and* emits FAQPage schema, so it can win its own
  result. Write real questions people type, not rhetorical ones.
- **`hero`** is a path under `/public` — normally a pose photo. **`hero_focal`**
  is `object-position` for the portrait crop. Katie's head and heart must stay in
  frame; never cut off the head.

  **Check this one by eye, every time.** The featured card on `/blog` crops the
  hero to **340×420 portrait**, and every photo in the library is 3:2 landscape —
  so roughly 46% of the width is thrown away and a wide horizontal shape gets
  chopped at both ends. Melting Heart lost her hands and her hips this way. Pick a
  pose whose body is compact in frame, or one lying along the crop, then render
  `/blog` and look at it before shipping. No focal value rescues the wrong photo.
- **`pin_quote`** activates the quote pin. **`pin_angles`** put the post in the
  Pinterest system — see below.
- `seo_title` ≤ ~60 chars, `seo_description` ≤ ~160.

## Pin angles

Two angles per post, each landing on a different board. The audience tag *is* the
board — the valid keys are in `src/lib/pinBoards.ts` (`PIN_BOARDS`).

**The character limits in `PIN_LIMITS` are hard**: audience 22, headline 40,
proof 54. Satori cannot shrink type to fit, so one character over doesn't wrap —
it runs off the canvas. The schema fails the build, which is the point.

Write them for someone scrolling past, not someone already reading the page.

## Giving away a routine

If the post gives away a practice, it needs a routine that is **not** in the
course. A routine with no `course:` key is public; `course: "runner-reset"` makes
it members-only and the public pages filter it out.

`minutes` is checked against the sequence by a build guard — holds, rebounds,
side switches and a 15s lead-in. **Never hand-compute it**: write the steps, run
the build, and use the number the error tells you.

Katie rebounds **30 seconds** between poses. The library default is still 45, so
set `rebound: 30` explicitly on each step until that default is changed. (Changing
it globally moves 21 of 23 routines and renames "Seven Honest Minutes" — a
separate decision.)

## Checks before it ships

```bash
npm run build          # schema, pin limits, duration guard, astro check
```

Then verify the things the build can't:

```bash
# in the listing, RSS and sitemap?
grep -c "<slug>" dist/blog/index.html dist/rss.xml dist/sitemap-0.xml
# no noindex page in the sitemap (should print 0)
python scripts/../  # see the cross-check in the repo history if needed
# every internal link resolves
grep -oE 'href="/(poses|routines|videos)/[a-z0-9-]+"' src/content/blog/<slug>.md
```

Every `/poses/…`, `/routines/…` and `/videos/…` link must exist as a built
directory. A link to an unenriched video page is noindex and a weak destination.

## Pin it on publish day, by hand

`/pincalendar` deliberately **does not** put a new post at the front of the queue.
The plan is seeded, not dated, so reloading it never reshuffles Katie's week —
which also means a post published today may not come up for weeks.

So on publish day, open `/pins`, find the post, and pin both angles manually. The
calendar will schedule it again later; that's fine, spaced repins are the point.

(If weekly posts start getting lost in the queue, the fix is to give journal pins
their own queue alongside `offer` and `video` in `src/lib/pinSchedule.ts` — not to
make the plan date-dependent.)

## Voice

Katie's, not yours. Plain, warm, second person, no hype and **no emoji**. She will
say the unhelpful true thing rather than the helpful-sounding one — that stretching
doesn't cure soreness, that you can't stretch your IT band — and that honesty is
the brand. Study `08-katie-voice.md` and `09-katie-voice-sample-runners-blog.md`
in `runner-reset-copy-pack/`.

Anything you write is a draft in her voice, not her voice. Ship it `unlisted`,
produce a review artifact, and let her pass it before it goes public.

## Don't

- Don't publish two posts to the same audience in one week; alternate.
- Don't repeat an existing post's target query — check `src/content/blog/` first.
- Don't promise a course that isn't built.
- Don't put a number in prose that the build doesn't guard. Routine durations,
  practice counts and prices drift, and only `minutes` fails loudly.
