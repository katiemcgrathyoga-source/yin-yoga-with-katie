import { getCollection } from 'astro:content';
import { POSE_FRAMES } from '../data/poseFrames';
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
 * TWO CREATIVES PER PAGE, SPLIT BY JOB
 *   Pose      Plate says what it does, Immersive says how it feels
 *   Routine   Frame says what it is, Panel says why you want it
 *   Journal   Panel leads on the title, Immersive leads on the idea
 *   Class     Watch, alone — its job is a click, not a save
 *   Offer     Offer, alone
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
};

/**
 * Can this photograph fill a full-bleed 2:3 frame without cutting into her?
 *
 * The only measurement left in the inventory, and the only one that never
 * excludes: a photo that fails simply letterboxes instead, which Immersive is
 * built to do. `keeps` is the fraction of the crop's width a 2:3 frame retains;
 * `span` is how much of that width Katie occupies.
 */
function fillsPortrait(slug: string): boolean {
  const frame = POSE_FRAMES[slug];
  if (!frame) return false;
  return Math.min(1, 1000 / 1500 / frame.aspect) >= frame.span;
}

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
  for (const pose of poses) {
    const d = pose.data;
    // No photograph, no pin. The alternative was a text-only card, and a cream
    // card with a sentence on it competes with every other cream card on
    // Pinterest while the photographs are the only thing here nobody else has.
    // These come back the day they are shot — see pinGaps().
    const img = photoOf(d.slug);
    if (!img) continue;

    const url = `${SITE}/poses/${d.slug}/`;
    const fills = fillsPortrait(d.slug);

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
        // Immersive — the same angle with the room around it. Wide poses
        // letterboxe into the ground rather than being cropped or excluded.
        add({
          ...base,
          id: `pose:${d.slug}:immersive:${tone}:${i}`,
          template: 'immersive',
          tone,
          image: cardUrl({
            ...shared, tpl: 'immersive', tone,
            sub: angle.proof, foot: `${d.name_en} · ${d.hold_time}`,
            fit: fills ? undefined : '1',
          }),
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
    const hero = photoOf(d.hero_pose ?? d.steps[0]?.pose ?? '');
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
      }
    }
  }

  // ── Classes on YouTube ───────────────────────────────────────────────────
  const videos = await getCollection('videos');
  for (const video of videos) {
    const d = video.data;
    if (!d.enriched || d.membership || d.pin_angles.length === 0) continue;
    // Watch needs a photograph and a video only has a YouTube thumbnail, so it
    // borrows the first pose the class features.
    const img = d.poses_featured.map(photoOf).find(Boolean);
    if (!img) continue;
    const angle = d.pin_angles[0];
    const audience = angle.audience as PinAudience;
    for (const tone of ['light', 'dark'] as PinTone[]) {
      add({
        id: `video:${d.slug}:watch:${tone}:0`,
        kind: 'video',
        label: d.display_title ?? d.title,
        template: 'watch',
        tone,
        audience,
        board: boardFor(audience),
        url: `${SITE}/videos/${d.slug}/`,
        description: describe(audience, d.seo_description),
        image: cardUrl({
          tpl: 'watch', tone, t: angle.headline, s: angle.audience,
          sub: angle.proof, dur: `${d.length_minutes} min`,
          foot: 'free on YouTube', img,
        }),
      });
    }
  }

  // ── Journal ──────────────────────────────────────────────────────────────
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
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
        add({
          ...base,
          id: `journal:${d.slug}:immersive:${tone}:${i}`,
          template: 'immersive',
          tone,
          image: cardUrl({
            tpl: 'immersive', tone, t: angle.headline, s: angle.audience,
            sub: angle.proof, foot: 'from the journal', img: hero,
            fit: fillsPortrait(slugOfPhoto(hero)) ? undefined : '1',
          }),
        });
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
