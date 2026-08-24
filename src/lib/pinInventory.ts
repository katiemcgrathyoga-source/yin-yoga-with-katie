import { getCollection } from 'astro:content';
import { POSE_FRAMES } from '../data/poseFrames';
import { immersiveHeight } from '../data/poseTall';
import { PIN_PAGES } from '../data/pinPages';
import { boardFor, type PinAudience } from './pinBoards';
import { publicRoutines } from './routines';

/**
 * Every pin the system can make, as data.
 *
 * A pin is never stored as an image — it is a triple of (page, template, tone)
 * that resolves to a deterministic /pin/card.png URL. Improve a template and
 * every future pin improves with it; nothing has to be regenerated.
 *
 * /pincalendar schedules from this list. /pins browses the same list.
 *
 * BUILT ON THE PLATE SET
 * The previous inventory carried eligibility machinery: a table of template
 * aspect ratios, a per-pose measurement of how much of the frame Katie
 * occupies, and arithmetic deciding which templates a pose was allowed to use.
 * Poses that failed it fell back to a text-only card, which was the worst pin
 * in the system and the thing Katie flagged first.
 *
 * The Plate templates put the photograph in a landscape band, and the library
 * is landscape, so every photo fits every template by construction. All of that
 * machinery is gone. The single remaining measurement is Immersive's `fit`
 * flag, and it does not exclude anything — it decides whether a photograph
 * fills the frame or letterboxes into the ground.
 *
 * IMMERSIVE IS THE HOUSE STYLE
 * Katie picked it out of the set, so it appears in every content type rather
 * than being one option among six. It is the only template that gives the
 * photograph the whole pin, which is the one advantage this library has over
 * every other yoga account on Pinterest — a calm room, good light, and 37 of
 * them. Everything else is there so a board doesn't read as the same pin
 * forty times.
 *
 *   Pose      Immersive says how it feels, Plate says what it does
 *   Routine   Immersive for the feeling, Frame for the facts, Panel for the why
 *   Journal   Immersive leads on the idea, Panel leads on the title
 *   Class     Immersive for the feeling, Watch for the run time and the play mark
 *   Offer     Offer, alone — it is the only pin with something to ask, and the
 *             pill is what does the asking
 */

export type PinTone = 'light' | 'dark';
export type PinKind = 'pose' | 'routine' | 'video' | 'journal' | 'offer';

export type Pin = {
  /** Stable across builds — the calendar's memory of what it has already used. */
  id: string;
  kind: PinKind;
  /** What Katie is pinning, for the calendar row. */
  label: string;
  template: string;
  tone: PinTone;
  board: string;
  audience: PinAudience;
  /** Where the pin lands. Always a page on the site that can capture an email. */
  url: string;
  /** The Pinterest description — written as someone would search, not as a caption. */
  description: string;
  /** The /pin/card.png URL that renders it. */
  image: string;
};

/**
 * Vertical focal point per template.
 *
 * Horizontal is always 50%: scripts/gen-pin-crops.mjs has already centred Katie
 * in /poses/pin/, which is the whole reason recomposing upstream was worth
 * doing. Vertical is not normalised, so a band that crops height needs a nudge
 * — the room below her is floor, and worth less than the body above it.
 */
const FOCAL: Record<string, string> = {
  plate: '50% 52%',     // 1.67:1 band — crops the most height of any template
  frame: '50% 50%',     // 1.49:1 inset, near the source shape; nothing to bias
  panel: '50% 50%',     // 1.3–1.5:1, likewise
  immersive: '50% 50%', // full-bleed 2:3 crops width, so vertical is moot
  watch: '50% 50%',     // 1.22:1 — crops width
  offer: '50% 52%',     // 1.79:1, the widest band in the set
  diagram: '50% 52%',   // same band shape as plate
  roster: '50% 50%',    // no main photo — only the per-row thumbnails
  hero: '50% 52%',      // same band shape as plate, just taller
};

/**
 * The Immersive photograph's height for this pose, or 0 if it can't have one.
 *
 * The one measurement left in the inventory. Immersive is the pin Katie picked
 * out of the set, so the rule is to give it to every pose that can carry it and
 * hand the rest to Panel — 21 of the 37 photographs qualify, and the sixteen
 * that don't are the wide lying shots where a 2:3 window would take her feet
 * off. See src/data/poseTall.ts for the arithmetic.
 */
const tallOf = (slug: string) => immersiveHeight(slug);

/**
 * How tall Panel's photograph can be before the type below it is squeezed.
 *
 * Panel centres its text in whatever is left, so a four-line headline on a
 * 760px photo would crowd the divider against the wordmark. The photo gives way
 * instead — the same principle the old Window template used, minus the
 * eligibility test.
 */
function panelPhotoHeight(headline: string, blurb: string): number {
  const titleLines = Math.max(1, Math.ceil(headline.length / 26)); // 72px Cormorant in 800px
  const blurbLines = blurb ? Math.max(1, Math.ceil(blurb.length / 42)) : 0; // 30px Cabin in 740px
  const text = 319 + titleLines * 82 + blurbLines * 45;
  return Math.round(Math.min(780, Math.max(520, 1500 - text)));
}

/** The phrase a person would actually type. The headline persuades; this ranks. */
const SEARCH_PHRASE: Record<PinAudience, string> = {
  'for runners': 'Yin yoga for runners',
  'for tired legs': 'Yin yoga for tired legs',
  'if you sit all day': 'Yin yoga for desk workers',
  'for stiff shoulders': 'Yin yoga for tight shoulders and neck',
  'for restless nights': 'Yin yoga for sleep',
  "when you're wound up": 'Yin yoga for stress and anxiety',
  'for beginners': 'Yin yoga for beginners',
  'for tight hips': 'Yin yoga for tight hips',
  'for a stiff back': 'Yin yoga for lower back pain',
  'for a full-body reset': 'Full body yin yoga',
  'to start the day': 'Morning yin yoga',
};

const LEVEL: Record<string, string> = {
  'all-levels': 'all levels',
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
};

const SITE = 'https://yinyogawithkatie.com';
const clamp = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n))}…`);
const describe = (audience: PinAudience, seo: string) =>
  clamp(`${SEARCH_PHRASE[audience]} — ${seo}`, 480);

/**
 * A pose's `cues` are full teaching sentences; Diagram shows them at a size
 * that still reads in a tiled Pinterest feed, which only leaves room for
 * about a line each — so one short clause, not the whole cue. Cutting at the
 * nearest comma (when there is one within reach) ends on a real pause rather
 * than an arbitrary word, which a plain character clamp does not guarantee.
 */
function cueClause(cue: string): string {
  const sentence = cue.split(/(?<=[.!?])\s/)[0];
  if (sentence.length <= 80) return sentence;
  const commaCut = sentence.slice(0, 80).lastIndexOf(',');
  return commaCut > 30 ? sentence.slice(0, commaCut) : clamp(sentence, 80);
}

/** "5 min" / "2.5 min each side" — a single step's hold, not a routine total. */
function fmtHold(seconds: number, sides: 1 | 2): string {
  const m = seconds / 60;
  const label = Number.isInteger(m) ? `${m} min` : `${m.toFixed(1)} min`;
  return sides === 2 ? `${label} each side` : label;
}

function cardUrl(params: Record<string, string | undefined>): string {
  const u = new URL('/pin/card.png', SITE);
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
  return u.href;
}

const photoOf = (slug: string) => (POSE_FRAMES[slug] ? `/poses/${slug}.jpg` : undefined);
/** A journal hero only counts if it is a pose photograph the pin templates can band. */
const heroPhoto = (hero?: string) => (hero?.startsWith('/poses/') ? hero : undefined);
const slugOfPhoto = (path: string) => path.replace('/poses/', '').replace('.jpg', '');

/** Build the whole inventory. Cheap enough to call once per page. */
export async function buildPinInventory(): Promise<Pin[]> {
  const pins: Pin[] = [];
  const add = (p: Pin) => pins.push(p);

  // ── Poses ────────────────────────────────────────────────────────────────
  const poses = await getCollection('poses');
  /** slug → display name, reused below to label Roster's routine rows. */
  const poseName = new Map(poses.map((ps) => [ps.data.slug, ps.data.name_en]));
  for (const pose of poses) {
    const d = pose.data;
    // No photograph, no pin. The alternative was a text-only card, and a cream
    // card with a sentence on it competes with every other cream card on
    // Pinterest while the photographs are the only thing here nobody else has.
    // These come back the day they are shot — see pinGaps().
    const img = photoOf(d.slug);
    if (!img) continue;

    const url = `${SITE}/poses/${d.slug}/`;
    const tall = tallOf(d.slug);

    for (const [i, angle] of d.pin_angles.entries()) {
      const audience = angle.audience as PinAudience;
      const base = {
        kind: 'pose' as const,
        label: d.name_en,
        audience,
        board: boardFor(audience),
        url,
        description: describe(audience, d.seo_description),
      };
      const shared = { t: angle.headline, s: angle.audience, img };

      for (const tone of ['light', 'dark'] as PinTone[]) {
        // Plate — the quiet one, and the shape already earning traction. The
        // benefit leads; the pose names itself in the footnote, where someone
        // who wants the name will look and nobody else has to read it.
        add({
          ...base,
          id: `pose:${d.slug}:plate:${tone}:${i}`,
          template: 'plate',
          tone,
          image: cardUrl({ ...shared, tpl: 'plate', tone, foot: `${d.name_en} · ${d.hold_time}` }),
        });
        // Immersive — the same angle with the type over the photograph. Or
        // Panel, for the wide lying shots that can't carry type without losing
        // an end of her. Same message either way; only the geometry differs.
        add({
          ...base,
          id: `pose:${d.slug}:${tall ? 'immersive' : 'panel'}:${tone}:${i}`,
          template: tall ? 'immersive' : 'panel',
          tone,
          image: tall
            ? cardUrl({
                ...shared, tpl: 'immersive', tone,
                sub: angle.proof, foot: `${d.name_en} · ${d.hold_time}`,
                ph: String(tall),
              })
            : cardUrl({
                ...shared, tpl: 'panel', tone, sub: angle.proof,
                ph: String(panelPhotoHeight(angle.headline, angle.proof)),
              }),
        });
        // Diagram — the pose as a reference card. Same shape as Plate, but the
        // air below carries the pose's own cues rather than standing empty —
        // the pin worth saving to come back to rather than admiring once.
        add({
          ...base,
          id: `pose:${d.slug}:diagram:${tone}:${i}`,
          template: 'diagram',
          tone,
          image: cardUrl({
            ...shared, tpl: 'diagram', tone,
            foot: `${d.name_en} · ${d.hold_time}`,
            cues: JSON.stringify(d.cues.slice(0, 2).map(cueClause)),
          }),
        });
        // Hero — brought back deliberately. Real Pinterest data on the pins
        // this replaced showed this exact shape (a generic eyebrow, a big
        // photo, and nothing but the pose's own name) among the best
        // performers in the whole library — no benefit copy, no cues, just
        // the photograph and the name. The eyebrow is static on purpose,
        // matching what actually tested well, not the per-angle audience tag
        // the other templates use.
        add({
          ...base,
          id: `pose:${d.slug}:hero:${tone}:${i}`,
          template: 'hero',
          tone,
          image: cardUrl({ t: d.name_en, s: 'A Yin Yoga Pose', img, tpl: 'hero', tone }),
        });
      }
    }
  }

  // ── Routines ─────────────────────────────────────────────────────────────
  const allRoutines = await getCollection('routines');
  /** Routine slug → its lead photograph. Also the journal's fallback, below. */
  const routineHero = new Map(
    allRoutines.map((r) => [r.data.slug, photoOf(r.data.hero_pose ?? r.data.steps[0]?.pose ?? '')]),
  );

  const routines = publicRoutines(allRoutines);
  for (const routine of routines) {
    const d = routine.data;
    const url = `${SITE}/routines/${d.slug}/`;
    // Not every routine names a hero pose; its first shape stands in fairly.
    const heroSlug = d.hero_pose ?? d.steps[0]?.pose ?? '';
    const hero = photoOf(heroSlug);
    // Frame and Panel show the routine's own lead pose. Immersive may reach
    // further down the sequence for a shape that can carry type over it — any
    // pose in the routine is honestly a picture of that routine.
    const immersiveSlug = tallOf(heroSlug)
      ? heroSlug
      : d.steps.map((s) => s.pose).find((slug) => photoOf(slug) && tallOf(slug));
    const metaLine = `${d.minutes} minutes · ${LEVEL[d.level] ?? d.level}`;

    for (const [i, angle] of d.pin_angles.entries()) {
      const audience = angle.audience as PinAudience;
      const base = {
        kind: 'routine' as const,
        label: d.title,
        audience,
        board: boardFor(audience),
        url,
        description: describe(audience, d.seo_description),
      };

      for (const tone of ['light', 'dark'] as PinTone[]) {
        // Frame — what it is. The routine's own name, its length and level,
        // and the angle's proof line underneath. The most information any pin
        // in the set carries, and it still does not feel crowded.
        add({
          ...base,
          id: `routine:${d.slug}:frame:${tone}:${i}`,
          template: 'frame',
          tone,
          image: cardUrl({
            tpl: 'frame', tone, t: d.title, s: angle.audience,
            meta: metaLine, sub: angle.proof, img: hero,
          }),
        });
        // Panel — why you want it. Benefit first, name nowhere.
        add({
          ...base,
          id: `routine:${d.slug}:panel:${tone}:${i}`,
          template: 'panel',
          tone,
          image: cardUrl({
            tpl: 'panel', tone, t: angle.headline, s: angle.audience,
            sub: angle.proof, img: hero,
            ph: String(panelPhotoHeight(angle.headline, angle.proof)),
          }),
        });
        // Immersive — the same angle with the type over the photograph, when
        // the routine's lead pose is one that can carry it.
        if (immersiveSlug) {
          add({
            ...base,
            id: `routine:${d.slug}:immersive:${tone}:${i}`,
            template: 'immersive',
            tone,
            image: cardUrl({
              tpl: 'immersive', tone, t: angle.headline, s: angle.audience,
              sub: angle.proof, img: photoOf(immersiveSlug),
              ph: String(tallOf(immersiveSlug)),
              foot: `${d.title} · ${d.minutes} min`,
            }),
          });
        }
        // Roster — the sequence itself: thumbnail, order and hold length per
        // pose, so someone can glance at the whole routine at once. Every step
        // gets a row even without a photo — the template falls back cleanly.
        add({
          ...base,
          id: `routine:${d.slug}:roster:${tone}:${i}`,
          template: 'roster',
          tone,
          image: cardUrl({
            tpl: 'roster', tone, t: d.title, s: angle.audience, sub: angle.proof,
            foot: `${d.minutes} minutes total`,
            items: JSON.stringify(
              d.steps.map((s) => ({
                name: poseName.get(s.pose) ?? s.pose,
                img: photoOf(s.pose),
                time: fmtHold(s.seconds, s.sides),
              })),
            ),
          }),
        });
      }
    }
  }

  // ── Classes on YouTube ───────────────────────────────────────────────────
  const videos = await getCollection('videos');
  for (const video of videos) {
    const d = video.data;
    if (!d.enriched || d.membership || d.pin_angles.length === 0) continue;
    // A class has only a YouTube thumbnail, so it borrows a pose it features.
    // Immersive gets first refusal on which one: given a choice of shapes, take
    // the one that can carry the template Katie picked. Watch takes whatever is
    // there, since a landscape band fits anything.
    const featured = d.poses_featured.filter((slug) => photoOf(slug));
    const tallSlug = featured.find((slug) => tallOf(slug));
    const img = photoOf(tallSlug ?? featured[0] ?? '');
    if (!img) continue;
    const angle = d.pin_angles[0];
    const audience = angle.audience as PinAudience;
    const base = {
      kind: 'video' as const,
      label: d.display_title ?? d.title,
      audience,
      board: boardFor(audience),
      url: `${SITE}/videos/${d.slug}/`,
      description: describe(audience, d.seo_description),
    };
    const shared = { t: angle.headline, s: angle.audience, sub: angle.proof, img };
    const tall = tallOf(slugOfPhoto(img));

    for (const tone of ['light', 'dark'] as PinTone[]) {
      // Watch — the run time on a badge with a play mark, so the pin says
      // "video" before anyone reads a word of it.
      add({
        ...base,
        id: `video:${d.slug}:watch:${tone}:0`,
        template: 'watch',
        tone,
        image: cardUrl({
          ...shared, tpl: 'watch', tone,
          dur: `${d.length_minutes} min`, foot: 'free on YouTube',
        }),
      });
      // Immersive — the same class as a feeling rather than a run time. The
      // footnote carries what the badge would have said.
      if (tall) {
        add({
          ...base,
          id: `video:${d.slug}:immersive:${tone}:0`,
          template: 'immersive',
          tone,
          image: cardUrl({
            ...shared, tpl: 'immersive', tone, ph: String(tall),
            foot: `free on YouTube · ${d.length_minutes} min`,
          }),
        });
      }
      // Roster — the poses in the class, in order, so someone can see the
      // shape of it before pressing play. No hold time here: a class isn't
      // authored with a per-pose duration, only chapter timestamps, which
      // mean something different (when it starts, not how long you hold it).
      add({
        ...base,
        id: `video:${d.slug}:roster:${tone}:0`,
        template: 'roster',
        tone,
        image: cardUrl({
          tpl: 'roster', tone, t: d.display_title ?? d.title, s: angle.audience,
          sub: angle.proof, foot: `free on YouTube · ${d.length_minutes} min`,
          items: JSON.stringify(featured.map((slug) => ({ name: poseName.get(slug) ?? slug, img: photoOf(slug) }))),
        }),
      });
    }
  }

  // ── Journal ──────────────────────────────────────────────────────────────
  // Unlisted as well as draft: an unlisted post renders noindex and is kept out of
  // the listing, RSS and the sitemap, so pinning it would drive Pinterest traffic
  // to a page we have told Google to ignore.
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft && !p.data.unlisted);
  for (const post of posts) {
    const d = post.data;
    const url = `${SITE}/blog/${d.slug}/`;
    // A post that leads on a pose photograph uses it. The one that doesn't
    // borrows the lead photo of the routine it tells you to go and practise —
    // which is the picture it would have chosen anyway, and a great deal better
    // than the photo-less card that would otherwise stand in.
    const hero = heroPhoto(d.hero) ?? (d.practise ? routineHero.get(d.practise.routine) : undefined);
    const seo = d.seo_description ?? d.description;

    for (const [i, angle] of d.pin_angles.entries()) {
      const audience = angle.audience as PinAudience;
      const base = {
        kind: 'journal' as const,
        label: d.title,
        audience,
        board: boardFor(audience),
        url,
        description: describe(audience, seo),
      };

      // No photograph anywhere to borrow means no pin. Every template in the
      // set is built around a photograph, and the alternative is the text card
      // this redesign exists to get rid of.
      if (!hero) continue;

      for (const tone of ['light', 'dark'] as PinTone[]) {
        // Panel — the post's own title, which is what someone searching finds.
        add({
          ...base,
          id: `journal:${d.slug}:panel:${tone}:${i}`,
          template: 'panel',
          tone,
          image: cardUrl({
            tpl: 'panel', tone, t: d.title, s: 'from the journal',
            sub: angle.proof, img: hero,
            ph: String(panelPhotoHeight(d.title, angle.proof)),
          }),
        });
        // Immersive — the idea instead of the title. These are the
        // highest-intent pins in the system, so they earn two genuinely
        // different reads rather than one design twice.
        const tall = tallOf(slugOfPhoto(hero));
        if (tall) {
          add({
            ...base,
            id: `journal:${d.slug}:immersive:${tone}:${i}`,
            template: 'immersive',
            tone,
            image: cardUrl({
              tpl: 'immersive', tone, t: angle.headline, s: angle.audience,
              sub: angle.proof, foot: 'from the journal', img: hero,
              ph: String(tall),
            }),
          });
        }
      }
    }
  }

  // ── The offer pins ───────────────────────────────────────────────────────
  for (const page of PIN_PAGES) {
    for (const [i, angle] of page.angles.entries()) {
      for (const tone of ['light', 'dark'] as PinTone[]) {
        add({
          id: `offer:${page.path}:offer:${tone}:${i}`,
          kind: 'offer',
          label: page.label,
          template: 'offer',
          tone,
          audience: angle.audience,
          board: boardFor(angle.audience),
          url: `${SITE}${page.path}`,
          description: describe(angle.audience, `${page.label}. ${angle.proof}`),
          image: cardUrl({
            tpl: 'offer', tone, t: angle.headline, s: angle.audience,
            sub: angle.proof, offer: page.offer, cta: page.cta,
            foot: `yinyogawithkatie.com${page.path}`,
            img: photoOf(page.image),
          }),
        });
      }
    }
  }

  return pins;
}

/**
 * Poses the inventory had to leave out, and why.
 *
 * Surfaced on /pins rather than hidden: an unphotographed pose is a shoot list,
 * not a bug, and it is worth more visible than a text card standing in for it.
 */
export async function pinGaps(): Promise<string[]> {
  const poses = await getCollection('poses');
  return poses.filter((p) => !photoOf(p.data.slug)).map((p) => p.data.name_en).sort();
}
