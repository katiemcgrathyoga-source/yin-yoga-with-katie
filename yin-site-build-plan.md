# Yin Yoga Directory — Build Plan & Decisions

Companion to the build spec. This is the "what we're building, in what order, and why" reference. Keep it in the repo (e.g. `/docs`) so Claude Code can read it as standing context.

---

## North star

- **Funnel:** YouTube (long-form main channel) → free pose directory (SEO + email capture) → paid membership (phase 3). The directory is the bridge.
- **Priorities, in order:** revenue first → output/efficiency → growth & retention.
- **Constraint:** solo creator. Every decision protects time. Build-once over one-offs; third-party tools over hand-built where the upkeep is heavy.

---

## The core architecture decision: two layers

Every feature in the vision sits in one of two layers. The dividing line is a single question: **does it need user accounts and stored data?**

**Layer 1 — static content** (no accounts; this is what ranks and captures email)
- Pose pages (the SEO money pages)
- Collection pages (per target area, per meridian)
- Prebuilt routines + a "next"-button practice player (warmup → main → cooldown)
- Session-only custom routine builder (pick poses, press play — as long as it isn't *saved* to a profile)
- Lead-magnet email capture

**Layer 2 — accounts + database** (the "app"; phase 3)
- Saved custom routines (tied to a person, returnable)
- Membership paywall
- Progress tracker / badges
- Community (posts, discussions, comments)
- True login-gated premium video

Almost the entire "bigger vision" lives in Layer 2, and Layer 2 features share one foundation: users log in, data is stored. **Build that foundation once and they all plug in.** The job in Layer 1 is to design so Layer 2 bolts on cleanly — never a rebuild.

---

## Tech stack

- **v1 = Astro + Tailwind, static**, deployed on Netlify/Vercel via Git. Best tool for the SEO content that earns the traffic and emails.
- **Pose data is decoupled** — one Markdown file per pose in `src/content/poses/`. Adding a pose = dropping in a file. No developer.
- **Phase 3 app layer bolts on** — accounts + database (e.g. Supabase) added as a gated section sharing the same design. The build spec's Next.js fork is noted but deferred; building it now would blow the top three priorities before a single page ranks.
- **Community is the exception:** when it comes (last), use a third-party platform (Circle, Discourse, or Discord) — not custom-built. A public community is the single biggest *ongoing* time burden in the plan (spam, moderation, safety). Do it last, don't hand-build it.

---

## Data model: poses and routines

- **Pose files are the single source of truth.** Everything references pose slugs.
- **Model "routine" as its own data type from day one**, even though v1 only ships prebuilt ones:
  - A routine = an ordered list of pose slugs, grouped into **warmup / main / cooldown**.
  - v1 ships prebuilt routines of this shape.
  - Phase-3 "saved custom routines" are the *same shape*, just user-created. Designing it once means no rework.
- **The practice player** reads a routine, plays each pose's short clip, and advances on "next." The breathing hold-timer (the pose-page signature element) lives inside it.

---

## Video strategy (unlisted clips)

- Pose clips are **short, 2–3 min, and posted UNLISTED** — separate from the long-form main channel. They embed exactly like public videos; the `youtube_video_id` field already handles them. No build change needed.
- **The real product is the *routine*, not the individual clip.** Spend friction on the molecule (the routine), not the atoms (single poses).
- **Honest limit:** an unlisted embed is *not secure* — the video ID is in the page source, so an email overlay is **friction, not a lock**.
  - **For v1 email capture: fine.** The goal is incentive, not security; most people will just enter an email. Acceptable leakage.
  - **For paid content (phase 3): not fine.** Premium video moves to a real private host (**Mux, Cloudflare Stream, or Vimeo private**) behind login. Cheap now, proper later.

---

## Email-capture strategy

Capture where the *value* is, not on the atoms:

- **Pose pages + their clips stay open / low-friction.** They're SEO landing pages — walling them fights the ranking strategy and the trust-building.
- **Capture at the value moments:**
  1. The **lead magnet** (a real reason to give an email — content not free elsewhere).
  2. The **"save your routine / come back to it"** moment ("Want to save this routine? Drop your email").
- **The captured email becomes the future login** — phase-3 accounts grow out of the v1 list. Capture is also account groundwork.

**Monetization ladder:** open pose pages (SEO + trust) → free routine builder + lead magnet (email) → saved routines, premium routines, members-only video on a real host (paid, phase 3).

---

## Lead magnet

- **Primary: "Bedtime Yin / Nervous-System Reset" sequence** — printable PDF + matching video + sequence page. Chosen on the data: the sleep/calm cluster is bigger in aggregate and *less competitive* than hips on YouTube, with enormous adjacent demand (nervous-system / anxiety terms). Broad reach for list growth.
- **Secondary capture: "Yin for Tight Hips"** — smaller but higher membership-intent; the high-intent segment.
- One asset, three jobs: lead magnet + SEO sequence page + embedded video (watch-time).
- **To verify post-launch:** confirm "yin yoga for sleep" demand on *Google* via Search Console (the VidIQ data is YouTube-only).

---

## SEO & keyword approach

- **VidIQ = YouTube demand** → sets film order and video titles.
- **Google/page demand = Search Console, free, post-launch.** (No Keyword Planner — no Google Ads account by choice. Search Console replaces it with real impression data once pages index.)
- **Likely YouTube-vs-Google divergence — confirm in Search Console:** `yin yoga for sciatica`, `for shoulders`, `for flexibility`, `for hamstrings` are quiet on YouTube but likely strong problem-solving queries on Google → **page-first, video optional.**
- **Lead with the searched name** in titles/H1, teach the yin name in the body:
  - Pigeon (not Sleeping Swan) · Malasana (not Garland) · Seated Forward Fold (not Caterpillar) · Happy Baby (common name).
- **Internal linking is the engine:** each pose links to/from its target-area and meridian collection pages, related poses, and any routine it belongs to.

### Pose build order (from VidIQ, winnability-weighted)

- **Flagship (high volume, film early despite competition):** Pigeon/Sleeping Swan, Butterfly, Yin for Hips.
- **Quick wins (high volume, low competition, light contraindications — best first shoots):** Frog, Happy Baby, Sphinx, Seated Forward Fold.
- **Strong but film carefully (contraindication-heavy):** Saddle, Snail — later, considered shoots.
- **Low YouTube demand — build the page now, video later:** Shoelace, Dragonfly, Melting Heart/Anahatasana, Fire Log, Toe Squat, meridian pages, and the divergence terms above.

---

## Content & safety standards

- **Pose content is grounded in the reference books** (Bernie Clark, Paul Grilley) — accuracy and contraindications map onto the schema. Copy is **original**; book text is never reproduced on the site.
- **Contraindications are never omitted.** Anything medical that can't be verified against the books gets flagged for the creator to confirm before publishing as advice.
- **Standing safety review** before any pose page goes live. Current open flags: Sleeping Swan knee/meniscus wording and pregnancy modification.

---

## Phased roadmap

**Phase 1 — Launch the SEO directory (now)**
- Pose-page template (`/poses/[slug]`), data-driven, calm/mobile-first, breathing hold-timer, cautions block, at-a-glance, schema.org HowTo, conditional video embed.
- Seed poses in build order (flagship + quick wins first).
- Collection pages (target area, meridian).
- Prebuilt routines + practice player.
- Lead-magnet capture (Bedtime sequence).
- Deploy + submit sitemap to Search Console. Indexing clock starts.

**Phase 2 — Depth & tuning**
- Session-only custom routine builder.
- More poses and prebuilt routines.
- Search Console-driven SEO tuning; confirm divergence terms; backfill video embeds as clips are filmed.

**Phase 3 — The app (accounts + database)**
- Accounts (grown from the email list) → membership paywall.
- Saved custom routines.
- Premium video on a real private host.
- Progress tracker / badges.
- Community via third-party platform — **last**.

---

## Cheap decisions to lock in now (so phase 3 never forces a rebuild)

1. Model **routines** as the warmup/main/cooldown ordered-slug type from the start.
2. Keep **pose files as the single source of truth**; routines and player only reference slugs.
3. Treat the **captured email as the seed of future accounts**.
4. Pick the phase-3 **auth/database direction in principle** (e.g. Supabase) so email tool, membership, badges, and community align later — but don't build it yet.

---

## Open items to verify

- "Yin yoga for sleep" demand on Google (Search Console, post-launch) — confirms the lead-magnet choice.
- Sleeping Swan safety flags (knee/meniscus, pregnancy) — verify before publishing.
- Email provider free-tier limits/pricing — verify live before wiring capture (these change).
- Divergence terms (sciatica/shoulders/flexibility/hamstrings) — confirm page-first via Search Console.
