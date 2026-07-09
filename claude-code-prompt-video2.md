# Claude Code Prompt — Add Video #2 (enriched)

## How to use this

1. Save `yin-yoga-for-sleep-challenge-day-1.md` into `C:\yin-site\src\content\videos\`.
2. In the Code tab, open `C:\yin-site`.
3. Paste the prompt below and approve as it goes.

---

## The prompt (copy everything below)

> Add a second, fully-enriched video to my Astro `videos` collection. The file `yin-yoga-for-sleep-challenge-day-1.md` is in `src/content/videos/`.
>
> 1. **Schema check first:** make sure the `videos` schema includes `enriched` (boolean, default false) and an optional `display_length` (string). If they aren't there yet (I may not have run the skeleton script), add them now so this file validates. `bend-like-bamboo.md` should still validate too.
> 2. Confirm the new record renders at `/videos/yin-yoga-for-sleep-challenge-day-1` using the same video-page template as Bamboo: thumbnail auto-derived from `youtube_id`, meta pills (showing `display_length` "30 min", not 26), the rendered blog body, the chapters list with each time deep-linking to `youtube.com/watch?v=hZ1rEDI-ITQ&t={seconds}s` and each pose linking to `/poses/{slug}`, the outcome-led membership CTA, and the gentle-reminder block. Player links out to YouTube (no embed).
> 3. Confirm the homepage now shows **two** video tiles, and that the filters work across both — e.g. selecting Intent "sleep" shows only this one, "flexibility" shows only Bamboo, and a Length filter buckets 26-min under 20–40 and 94-min under 60+.
> 4. Some of this video's `poses_featured` / chapter poses (butterfly, sphinx, childs-pose, eagle-arms) may not have pose pages yet — those links can 404 for now; don't create the pose pages, just leave the links.
> 5. Run the preview, show me the new video page and the two-tile homepage with a sleep filter applied, and confirm `astro check` passes with 0 errors.

---

## After it works

Tell me it renders and the filtering behaves, and we move to the **skeleton script** (the `claude-code-prompt-skeleton.md` prompt) to generate the rest of the back catalogue — after which your whole library is browsable, and we enrich down the top-performer list from there.
