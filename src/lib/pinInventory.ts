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
 * How a template's photo window is shaped. `keeps()` turns that into the
 * fraction of the crop's width that survives, which is what decides whether a
 * pose fits — see src/data/poseFrames.ts.
 */
const TEMPLATE_ASPECT: Record<string, number> = {
  hook: 1000 / 1500,   // full bleed — the most demanding by far
  split: 1000 / 1040,  // the arch, near square
  video: 1000 / 860,
  window: 1000 / 660,  // wider than the crop, so it never cuts her
  offer: 1000 / 720,
  states: 1000 / 700,
};

/** Does this pose survive this template's crop with her whole body intact? */
function fits(template: string, slug: string): boolean {
  const frame = POSE_FRAMES[slug];
  if (!frame) return false;
  const target = TEMPLATE_ASPECT[template];
  if (!target) return true; // card has no photo
  const keeps = Math.min(1, target / frame.aspect);
  return keeps >= frame.span;
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
const minutes = (secs: number, sides: number) =>
  `${Math.max(1, Math.round(secs / 60))} min${sides === 2 ? ' each side' : ''}`;

/** Build the whole inventory. Cheap enough to call once per page. */
export async function buildPinInventory(): Promise<Pin[]> {
  const pins: Pin[] = [];
  const add = (p: Pin) => pins.push(p);

  // ── Poses ────────────────────────────────────────────────────────────────
  const poses = await getCollection('poses');
  for (const pose of poses) {
    const d = pose.data;
    const url = `${SITE}/poses/${d.slug}/`;
    const img = photoOf(d.slug);
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
      // The photograph is the whole advantage here — a calm room, good light,
      // and 37 of them. A text-only pin throws that away to compete with every
      // other cream-background quote graphic on Pinterest, so the card is only
      // for the five poses that have no photograph yet. Hook and split are
      // earned on measurement, not assumed.
      const templates = img ? ['window'] : ['card'];
      if (img && fits('hook', d.slug)) templates.push('hook');
      if (img && fits('split', d.slug)) templates.push('split');

      for (const template of templates) {
        for (const tone of ['light', 'dark'] as PinTone[]) {
          add({
            ...base,
            id: `pose:${d.slug}:${template}:${tone}:${i}`,
            template,
            tone,
            image: cardUrl({
              tpl: template, tone,
              t: angle.headline, s: angle.audience, sub: angle.proof,
              id: template === 'split' ? d.hold_time : `${d.name_en} · a yin yoga pose`,
              pose: template === 'split' ? d.name_en : undefined,
              img: template === 'card' ? undefined : img,
            }),
          });
        }
      }
    }
  }

  // ── Routines ─────────────────────────────────────────────────────────────
  const poseBySlug = new Map(poses.map((p) => [p.data.slug, p.data]));
  const routines = publicRoutines(await getCollection('routines'));
  for (const routine of routines) {
    const d = routine.data;
    const url = `${SITE}/routines/${d.slug}/`;
    const items = d.steps.map((s) => {
      const pose = poseBySlug.get(s.pose);
      return {
        name: pose?.name_en ?? s.pose,
        note: s.note ? clamp(s.note, 34) : undefined,
        hold: minutes(s.seconds, s.sides ?? 1),
        img: photoOf(s.pose),
      };
    });
    const hero = d.hero_pose ? photoOf(d.hero_pose) : undefined;

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
      // The pose list is the routine's own strongest creative, and the hero
      // photo covers the rest. No need for a text card as well.
      const templates = ['poselist', ...(hero ? ['window'] : ['card'])];
      for (const template of templates) {
        for (const tone of ['light', 'dark'] as PinTone[]) {
          add({
            ...base,
            id: `routine:${d.slug}:${template}:${tone}:${i}`,
            template,
            tone,
            image: cardUrl({
              tpl: template, tone,
              t: angle.headline, s: angle.audience, sub: angle.proof,
              id: `a ${d.minutes}-minute routine`,
              items: template === 'poselist' ? JSON.stringify(items) : undefined,
              img: template === 'window' ? hero : undefined,
            }),
          });
        }
      }
    }
  }

  // ── Videos ───────────────────────────────────────────────────────────────
  const videos = await getCollection('videos');
  for (const video of videos) {
    const d = video.data;
    if (!d.enriched || d.membership || d.pin_angles.length === 0) continue;
    // The Watch with me template needs a photograph, and a video only has a
    // YouTube thumbnail. Borrow the first pose it features.
    const img = d.poses_featured.map(photoOf).find(Boolean);
    if (!img) continue;
    const angle = d.pin_angles[0];
    const audience = angle.audience as PinAudience;
    for (const tone of ['light', 'dark'] as PinTone[]) {
      add({
        id: `video:${d.slug}:video:${tone}:0`,
        kind: 'video',
        label: d.display_title ?? d.title,
        template: 'video',
        tone,
        audience,
        board: boardFor(audience),
        url: `${SITE}/videos/${d.slug}/`,
        description: describe(audience, d.seo_description),
        image: cardUrl({
          tpl: 'video', tone,
          t: angle.headline, s: angle.audience, sub: angle.proof,
          id: `free on YouTube · ${d.length_minutes} min`,
          dur: `${d.length_minutes} min`,
          img,
        }),
      });
    }
  }

  // ── Journal ──────────────────────────────────────────────────────────────
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
  for (const post of posts) {
    const d = post.data;
    const url = `${SITE}/blog/${d.slug}/`;
    // Every post but one leads on a pose photograph, so the window carries them.
    // The card stays as a second creative here and nowhere else: a journal pin
    // is about an idea, which is the one case a statement genuinely beats a
    // photograph — and these are the highest-intent pins in the system, so they
    // earn two.
    const hero = d.hero?.startsWith('/poses/') ? d.hero : undefined;
    const templates = hero ? ['window', 'card'] : ['card'];

    for (const [i, angle] of d.pin_angles.entries()) {
      const audience = angle.audience as PinAudience;
      for (const template of templates) {
        for (const tone of ['light', 'dark'] as PinTone[]) {
          add({
            id: `journal:${d.slug}:${template}:${tone}:${i}`,
            kind: 'journal',
            label: d.title,
            template,
            tone,
            audience,
            board: boardFor(audience),
            url,
            description: describe(audience, d.seo_description ?? d.description),
            image: cardUrl({
              tpl: template, tone,
              t: angle.headline, s: angle.audience, sub: angle.proof,
              id: 'from the journal',
              img: template === 'window' ? hero : undefined,
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
            tpl: 'offer', tone,
            t: angle.headline, s: angle.audience, sub: angle.proof,
            offer: page.offer, cta: page.cta,
            id: `yinyogawithkatie.com${page.path}`,
            img: photoOf(page.image),
          }),
        });
      }
    }
  }

  return pins;
}
