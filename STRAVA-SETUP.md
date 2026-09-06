# Strava: the yin link on every run

When Kevin uploads a run, a Netlify function appends two lines to its description:
the matching public yin routine (with its follow-along timer) and the free
post-run class for runners. Every follower sees it in their feed. Nothing else
changes on the activity, and it only ever touches Kevin's own runs.

What it writes, for an easy run:

```
Post-run yin: The Outside Line, 26 min, follow-along timer
https://yinyogawithkatie.com/routines/the-outside-line/
Free 15-min post-run yin class for runners: https://yinyogawithkatie.com/runners
```

How it chooses (`netlify/functions/lib/strava-routine.mjs`):

| Run | Routine |
|---|---|
| Race (tagged Race on Strava) | The Day After, framed as "tomorrow morning" |
| Long run (tagged Long, or 16 km+) | The Day After / Deep Hips & Lower Body, alternating |
| Workout (tagged Workout) | Deep Legs & Hamstrings / The Day After |
| Hilly (12 m+ of climb per km, 5 km+) | Deep Legs & Hamstrings |
| Everything else | The Outside Line, Deep Hips, Lower-Back Release, Full-Body Reset, rotating |

Only public routines are linked. Course routines would land a stranger on a
paywall; the public routine pages carry the runner offer themselves.

## One-time setup (about 20 minutes)

1. **Create the Strava API app.** https://www.strava.com/settings/api. Any name
   ("Yin Yoga with Katie"), category Other, website `https://yinyogawithkatie.com`,
   **Authorization Callback Domain `yinyogawithkatie.com`**. Note the Client ID and
   Client Secret.

2. **Set the env vars in Netlify** (Site configuration → Environment variables):
   `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_VERIFY_TOKEN` (any long
   random string, e.g. `openssl rand -hex 24`). Leave `STRAVA_ATHLETE_ID` unset for
   now. Deploy so the functions exist.

3. **Connect Kevin's Strava.** Signed in to Strava as Kevin, open
   `https://yinyogawithkatie.com/api/strava-auth?key=<STRAVA_VERIFY_TOKEN>`.
   Approve both permissions (read activities, write activities). The page that
   comes back prints the athlete id. Set `STRAVA_ATHLETE_ID` to it in Netlify and
   redeploy. From then on no other Strava account can connect.

4. **Create the webhook subscription.** Once, from any terminal:

   ```bash
   curl -X POST https://www.strava.com/api/v3/push_subscriptions \
     -F client_id=<STRAVA_CLIENT_ID> \
     -F client_secret=<STRAVA_CLIENT_SECRET> \
     -F callback_url=https://yinyogawithkatie.com/api/strava-webhook \
     -F verify_token=<STRAVA_VERIFY_TOKEN>
   ```

   Strava calls the callback to check it, then answers with `{"id": ...}`. Only
   one subscription per app is allowed; to see it, `GET` the same URL with
   `client_id` and `client_secret` as query params.

5. **Go for a run.** Upload it; the description should update within a few
   seconds of Strava's own processing. If it doesn't, Netlify → Logs → Functions →
   `strava-webhook` says why, in plain words.

## Things to know

- **Edit the description freely.** The block is appended below whatever Kevin
  writes on upload. If he edits later, Strava sends an `update` event, which is
  ignored, so nothing is re-added or overwritten.
- **Retries are safe.** If Strava retries an event, the marker
  `yinyogawithkatie.com` in the description stops a second copy.
- **Non-runs are ignored** (rides, walks, swims). Trail and treadmill runs count.
- **Tokens** live in Netlify Blobs (store `strava`, key `tokens`) and refresh
  themselves. To disconnect, revoke the app at https://www.strava.com/settings/apps
  and delete the subscription:
  `curl -X DELETE "https://www.strava.com/api/v3/push_subscriptions/<id>?client_id=..&client_secret=.."`.
- **Strava's API agreement** allows an app to modify the authorised athlete's
  own activities, which is all this does. It does not read or display anyone
  else's data.
- **Measuring it:** Cloudflare Web Analytics shows `strava.com` as a referrer, and
  runner signups from those pages land with `signup_source` `routine-top-runner`
  or `routine-runner` in the MailerLite report (`npm run mailerlite`).

## Local test

```bash
node netlify/functions/lib/strava-routine.test.mjs
```
