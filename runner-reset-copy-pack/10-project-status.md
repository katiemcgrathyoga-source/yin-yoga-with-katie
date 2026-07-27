# The Runner's Reset — Project Status & Go-Live Checklist

The single source of truth for where the runner project stands. Most of the code
is done; the remaining work is mostly **yours** (filming, MailerLite, checkout).
Nothing here is deployed yet — it's all one pending batch.

_Last updated: 2026-07-19_

---

## ✅ Built & code-complete (in the repo, builds pass)

| Thing | Where | Notes |
|---|---|---|
| Sitewide email capture | `Cta.astro` + pose/routine/journal/program/video pages | Inline signup, contextual per-page copy, `signup_source` tags |
| Free runner landing page | `src/pages/runners.astro` (`/runners`) | Captures email tagged `source: "runner"` |
| Course sessions (9) | `src/content/sessions/` + `src/pages/sessions/[slug].astro` | Video + timer + why + cues + body map; **no videos yet** |
| Yoga-for-Runners blog | `src/content/blog/yoga-for-runners.md` | Links your 4 runner videos + 11 poses, funnels to `/runners` |

**Reference docs (copy to use later):** `runner-reset-course-plan.md`,
`runner-reset-session-map.md`, `runner-reset-launch-emails.md`,
`runner-lead-magnet-and-video-cta.md`, `email-welcome-sequence.md`,
`pinterest-pinning-schedule.md`.

---

## ⏳ Blocked on YOU — the real bottlenecks

Nothing below can go live until these are done. In rough order:

1. **Film the free lead-magnet short** — the *10-Minute Post-Run Reset* → upload
   unlisted → paste its link into the MailerLite delivery email.
2. **Set up MailerLite for runners** — create a "Runners" form/group, build the
   delivery + bridge emails (copy in `runner-lead-magnet-and-video-cta.md`), and
   point `/runners` at that form (or branch on `signup_source: runner`). *Until
   this is done, runner signups would get the retreat email, not the Post-Run Reset.*
3. **Add CTAs to your 5 runner YouTube videos** — pinned comment + description link
   to `/runners` (copy ready). Fifteen minutes; starts the list filling.
4. **Film the 9 course videos** — 6 Target shorts + 3 Full Resets (the Silent Reset
   is the Full Reset filmed quietly). Drop each YouTube ID into its session file's
   `youtube_video_id`. Session sequences are in `runner-reset-course-plan.md`.
5. **Set up checkout** — a Gumroad or Stripe payment link for the founding sale;
   on purchase, deliver a private page listing the unlisted session links.
6. **Load the founding launch emails** — into MailerLite when you're ready to sell
   (copy in `runner-reset-launch-emails.md`).
7. **Pin on Pinterest** — per `pinterest-pinning-schedule.md`.

---

## 🚀 Recommended order (funnel logic: build the list before you sell)

1. **Deploy the current batch** → email capture, the runner blog and `/runners` go
   live. Capture and SEO start working immediately.
2. **Film the lead-magnet short + wire MailerLite (steps 1–2 above)** → the
   `/runners` funnel is live; the runner list starts filling.
3. **Add the YouTube CTAs + start pinning (steps 3, 7)** → drive runners in.
4. **~6–8 weeks: film the course videos (step 4)** while the list grows.
5. **Set up checkout + load the launch series (steps 5–6)** → run the founding launch.
6. **Later:** Start Here page, the $10 membership (accounts + paywall), calendar plans.

---

## Deliberately NOT done yet (and why)

- **Free browsable taster** (making one session public for SEO) — pointless until a
  video exists on it. Revisit after filming; flip `access: members` → `free` on
  `hips-hip-flexors`.
- **Blog → course cross-links** — the session pages are empty/hidden, so linking
  there now sends readers to a dead end. Add once videos are in.
- **Separate on-site pages for the runner videos** — lower-leverage than the blog
  (they'd compete with YouTube). The blog already brings those videos on-site. Only
  revisit if you specifically want them, and it would need transcripts/descriptions.

---

## Not deployed — the pending batch

Everything above is committed-ready but unpushed (per the deploy-sparingly rule):
`src/pages/runners.astro`, `src/pages/sessions/`, `src/content/sessions/`,
`src/content/blog/yoga-for-runners.md`, `src/content.config.ts`, and the
email-capture edits to `Cta.astro` + the pose/routine/journal/program/video pages
+ `global.css`. One `npm run build` and one deploy ships all of it.
