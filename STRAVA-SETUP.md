# Strava: the yin routine as its own activity

Log the yin as a separate **Yoga** activity in the Strava app, titled with the
routine's name, and a Netlify function writes one plain line into its description
with the routine link. No pitch; the routine page carries the runner offer.
Everyone following Kevin sees it, the same way a gym session shows up. Runs are
never touched, so nothing looks automatic and nothing claims yin he didn't do.

What a follower sees on a Yoga activity titled "The Outside Line":

```
Dragon 2½ min each side
Deer 2½ min each side
Banana 3 min each side
Reclined Swan 2½ min each side
Corpse 2 min

yinyogawithkatie.com/r/outside
```

(The pose list comes from `netlify/functions/lib/strava-routines.json`, generated
from the routine files by `node scripts/gen-strava-routines.mjs`; re-run it after
editing a routine, or the lib test fails.)

## Using it

In the Strava app: **+ → Manual activity → Yoga**, set the time, and title it:

| Title contains | Routine |
|---|---|
| `The Outside Line`, `outside` | The Outside Line |
| `Deep Hips`, `hips` | Deep Hips & Lower Body |
| `Deep Legs`, `legs`, `hamstrings` | Deep Legs & Hamstrings |
| `Lower-Back Release`, `back` | Lower-Back Release |
| `The Day After`, `day-after` | The Day After |
| `Full-Body Reset`, `full`, `reset` | Full-Body Reset |
| `Tight Hips After Running`, `tight-hips` | Tight Hips After Running |
| `After the Run`, `after-run`, `post-run` | After the Run |
| `Rest-Day Recovery`, `rest-day`, `recovery` | Rest-Day Recovery |

Anything else you write in the title stays ("Evening yin: outside" works). A Yoga
activity whose title doesn't name a routine is left alone. Add the muscle-map
photo in the same screen.

**The quickest way, once `STRAVA_LOG_KEY` is set:** finish the routine on the
site and press **Log to Strava** on the completion screen. The title, length and
description are filled in for you, so there is nothing to type. (The card does
*not* say "via Yin Yoga with Katie" — tested 2026-09-06, an API-created activity
is credited exactly like a hand-typed one.) Open
any routine page once with `?strava-log=<STRAVA_LOG_KEY>` to put the button on
your phone; it stays until you clear site data. Photos still go on by hand
afterwards, since the API cannot upload them — but the finish screen shows a
**Save the muscle map** link next to the button (only when the key is set), which
opens the routine's map full-size; long-press to save, and it's the newest photo
in the roll when you open the activity in the app.

**Fallback, for keeping it on the run:** `+yin` in a run's title (or `+yin hips`
to name one) writes the same block onto the run and removes the tag. `+yin` alone
picks from the run: race or long run → The Day After, hills → Deep Legs &
Hamstrings, easy runs rotate through the hip and back routines. Put it in the
**title**, which also works when edited later; a tag typed only in the
description works at upload time.

**The muscle-map photo** is yours to add from the Strava app, since the API
can't upload photos. One image per routine, front and back, worked muscles in
rose quartz: `design/strava-maps/<routine>.jpg`. Keep the nine on your phone.
The same maps are on each routine page under "Where it works" (web copies in
`public/bodymap/routines/`, listed in `src/lib/routineMaps.ts`).

How `+yin` chooses on its own (`netlify/functions/lib/strava-routine.mjs`):

| Run | Routine |
|---|---|
| Race (tagged Race on Strava) | The Day After |
| Long run (tagged Long, or 16 km+) | The Day After / Rest-Day Recovery / Deep Hips & Lower Body, rotating |
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

5. **Log a yoga activity** titled "The Outside Line"; the description gains the
   block within a few seconds. If it doesn't, Netlify → Logs → Functions →
   `strava-webhook` says why, in plain words.

**Short links.** Posts link `yinyogawithkatie.com/r/legs` and friends rather than
the full routine path — ours, not a bit.ly, so the link plainly reads as Katie's.
The aliases live in `netlify/functions/lib/strava-routine.mjs` (`SHORT`) and the
redirects in `netlify.toml`; the test fails if the two drift.

## Things to know

- **Runs without `+yin` are never touched**, and neither is a yoga activity that doesn't name a routine. Edit anything freely.
- **Retries are safe.** If Strava retries an event, the marker
  `yinyogawithkatie.com` in the description stops a second copy.
- **Non-runs** only get a block if the tag names a routine (`+yin back` on a
  ride works; bare `+yin` on a ride does nothing). Trail and treadmill runs count
  as runs.
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

**Timer screenshot for a post:** `node scripts/shot-timer.mjs <routine-slug> <out.png> 40` against a
static serve of `dist/` (see the script header). Attach it next to the muscle map.

## Logging for everyone

Any signed-in member can connect their own Strava (Your account -> Connect
Strava, or just press **Log to Strava** on a runner routine's finish screen and
follow the prompts: sign in, connect, and the interrupted log finishes itself
when they land back on the page). The activity goes to THEIR feed with the
poses, the holds and the link, and the webhook treats their runs the same way
it treats Kevin's (`+yin`, or a Yoga activity titled with a routine).

Pieces: `netlify/functions/strava-connect.mjs` (OAuth, per-member tokens under
`user:<supabase id>` in the `strava` blobs store, plus `athlete:<strava id>` so
the webhook can find them), `lib/supabase-user.mjs` (who is calling),
`lib/strava-tokens.mjs` (one refresh path for every token).

**Strava caps a new API app at ONE connected athlete** until you ask them to
raise it: developers.strava.com -> your app -> request more athletes (they ask
what the app does and for screenshots; usually a few days). Until that's
granted only Kevin's connection works, and anyone else sees "Strava isn't
letting new people connect to this app just yet".

## Editing a muscle map

The maps are generated in Grok, but changing *which* muscles are lit doesn't need
a new render — that risks a figure that no longer matches the set. Instead edit a
clean source (originals are in `design/strava-maps/source/`):

```bash
# list every segment's centroid, lit or grey
node scripts/strava-map-edit.mjs design/strava-maps/source/deep-legs-hamstrings.jpg - map
# light some, unlight others
node scripts/strava-map-edit.mjs <source> <out> on:344,302 off:890,1100
```

Coordinates are for the 1408px square. Full-Body Reset was built this way.
