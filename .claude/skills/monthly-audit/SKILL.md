---
name: monthly-audit
description: Run the monthly performance audit across YouTube, website, email, Pinterest and the course — pull what's automatable, request the rest, diagnose the funnel, and rank next month's work against the available hours. Use at the start of a month, or when asked how things are performing / what's working / where to focus.
---

# Monthly performance audit

One run per month, at the start of the month, covering the month just ended. The point is **not** a scoreboard — it is a ranked answer to "where do my hours go next month". Numbers that do not change that answer are noise.

Output goes to `data/audits/YYYY-MM.md` (committed, diffable, machine-readable) **and** a published artifact for sharing with Katie.

---

## 0. Before anything else

Read the previous month's file — `data/audits/` sorted descending. Its **§7 Metrics to carry forward** block is the comparison baseline. Never re-derive last month's numbers from the dashboards; use what was recorded.

If there is no previous file, this is month zero: state that plainly, set baselines, and skip all deltas rather than inventing them.

---

## 1. Interview (keep it to two questions)

Kevin's standing preferences are known — don't re-ask them:

- Pull automatically wherever credentials exist; checklist for the rest.
- Output = repo markdown **plus** artifact.
- The audit drives **where next month's hours go**.

Only two things genuinely change month to month:

1. **Hours available per week next month.** Under 5 means one or two recommendations and everything else explicitly parked.
2. **Anything that changed** — a launch, a price change, a publishing break, a new channel.

Ask those, then go.

---

## 2. Pull what's automatable

### YouTube — vidIQ MCP, channel `UC3tO-lEyiexDPkN75ADTjCQ`

Load schemas first with one batched `ToolSearch` call. Five calls cover the audit:

| Call | Args | Gives |
|---|---|---|
| `vidiq_channel_stats` | `from`/`to` = the month | Sub count, public view delta, **videos published** |
| `vidiq_channel_analytics` | `dimensions:["month"]`, 12-month span | The trend line and YoY comparisons |
| `vidiq_channel_analytics` | `report:"traffic_sources"` | Where views come from |
| `vidiq_channel_analytics` | `report:"top_videos"`, `maxResults:15` | What actually performed |
| `vidiq_channel_analytics` | `report:"shorts_vs_longform_split"` | The format-value argument |

Two more worth the credits when the story needs them:

- `dimensions:["insightTrafficSourceDetail"]` + `filters:"insightTrafficSourceType==EXT_URL"` — **who sends traffic to YouTube.** Watch specifically for whether `yinyogawithkatie.com` appears at all.
- `vidiq_get_videos_by_ids` — top_videos returns bare IDs; fetch titles or the section is unreadable.

### Course + accounts

```bash
set -a; . ./.env; set +a
# accounts
curl -s -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$PUBLIC_SUPABASE_URL/auth/v1/admin/users?per_page=200"
# entitlements — source tells you manual grant vs real purchase
curl -s -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$PUBLIC_SUPABASE_URL/rest/v1/entitlements?select=product,source,created_at"
```

Discount internal accounts — Katie's, Kevin's, and any `source: manual` grant — before reporting customer counts.

Polar is the live payment provider. If `POLAR_ACCESS_TOKEN` is in `.env`, pull orders; otherwise it goes on the checklist.

---

## 3. The checklist for everything else

Send this in one message so Kevin gathers in a single pass. Screenshots are fine — read them from `~/Pictures/Screenshots` filtered by mtime, and expect unrelated screenshots from other projects mixed in.

**Cloudflare Web Analytics** — visits, pageviews, top 5 pages, top 5 referrers.
*Find it under Analytics & Logs → Web Analytics, account level. There is no Cloudflare zone; DNS is Netlify.*

**Netlify** — pageviews, unique visitors, top pages, top sources. 7-day window only.

**MailerLite** — total subscribers, signups this month, unsubscribes, per-group counts, last campaign open/click.

**Pinterest** — impressions, outbound clicks, saves, followers, top boards by outbound clicks, top pins by saves.

**Money** — YouTube membership revenue + member count + gained/cancelled, **ad revenue**, Buy Me a Coffee, Polar.

---

## 4. Traps that produce wrong numbers

These have all bitten once. Check every one.

- **`LEMONSQUEEZY_*` in `.env` is dead.** Polar is the provider. The LS API returns empty, not an error — easy to misread as "zero sales confirmed".
- **YouTube Analytics lags ~1 day.** A month queried on the 30th returns 29 days. **Always normalise to per-day** before comparing months, and mark any 31-day projection as a projection.
- **`vidiq_channel_stats` and `channel_analytics` disagree** on views (public counter vs Analytics). Use Analytics; note the other if it matters.
- **Month-dimension queries snap to month boundaries.** Passing `endDate` mid-month still returns the whole month.
- **Netlify's window is 7 days.** Never present an extrapolation as a measurement.
- **MailerLite's Newsletter group is the master list** — that is the total. Other groups overlap it; summing them double-counts.
- **MailerLite form conversion rate is always 0%** — the site uses its own forms, so their tracking never sees an impression. Meaningless, don't report it.
- **Membership revenue is NT$, not US$**, despite the `$` glyph in Studio.
- **Pinterest "total audience" is reach, not followers.** Ask for followers separately.
- **Pinterest percent deltas compare to the prior 29 days** off a tiny base. +400% can be 8 saves becoming 32.
- **Bot traffic.** Netlify counts server-side (bots included); Cloudflare is a client-side beacon (bots excluded). Where they disagree, that gap *is* the bot share.

---

## 5. The analysis frame

Four passes, in this order. Skip the pretty charts; find the constraint.

**1. Build the funnel.** Subscribers → views → site visits → signups → sales, with the conversion at each step. The worst step is the audit. Everything else is context.

**2. Check value, not volume.** Views are not the metric. Split long-form vs Shorts by *watch time*; compare a top long-form video's minutes against the month's best Shorts. Volume metrics flatter formats that produce nothing.

**3. Read the slope, not the month.** Compute YoY per month across the last 12–24 months. A single bad month against a prior peak is noise; four months of decelerating YoY is a trend. Say which one you have, and name the peak if there is one.

**4. Follow the money.** Rank every revenue line. Recommendations must not spend hours on a line that cannot matter — a €20/month tip jar cannot outrank a list-building fix, regardless of how easy it is.

---

## 6. Writing the recommendations

This is the part that earns the audit.

- **Rank against the stated hours.** Under 5 hrs/week means 4–5 items, then a hard line.
- **Everything below the line is parked *with a reason*** — "not doing this because X" is a finding. Silent omission is not.
- **Attach a time cost to each item.** "~2 hrs", "0 hrs — a decision".
- **Narrow the scope of the work.** "Top 10 videos", not "all videos". Concentration is what makes 2 hours viable.
- **State honest limits.** Where the data cannot settle a question — YouTube won't break subscribers down by format — say so in the recommendation rather than implying proof.
- **Prefer a measurable experiment** when a recommendation is uncertain: change one thing, name the number that would confirm it, check at the next audit.

Numbered markers belong on the recommendations, where rank is real information. Do not number anything else.

---

## 7. Output

**`data/audits/YYYY-MM.md`** — sections: caveats table, scoreboard, funnel, what's working, what needs attention, ranked recommendations, parked-with-reasons, data gaps, and **§7 metrics-to-carry-forward** as a flat `key: value` block. That last block is what next month reads; keep the keys stable across months so they stay comparable.

**Artifact** — load `artifact-design` first. Brand tokens live in `src/styles/`: paper `#F9F1EA`, sage-deep `#363F39`, ink `#2E342F`, rosewood `#89494B`. Keep semantic colours (good/warn/critical) separate from the rosewood accent, and use tabular numerals everywhere digits align.

Then update `MEMORY.md` if the audit contradicts a stored belief — an audit that finds the opposite of what memory says and leaves memory unchanged has failed.

**Do not deploy.** Any code fix found during the audit gets built and verified, then batched for Kevin's explicit go-ahead.
