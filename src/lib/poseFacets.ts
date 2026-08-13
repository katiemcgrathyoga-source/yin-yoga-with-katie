import { AUDIENCES } from '../data/audiences';
import { FOCUS } from './videoFacets';

/**
 * The pose library's body-area taxonomy, and how it maps onto the class hubs.
 *
 * These buckets used to live inside `src/pages/poses/index.astro`, which was
 * fine while they only powered that page's filter. They now also decide which
 * class hub a pose page points at, and two copies of a taxonomy is how a pose
 * ends up filed under "Hamstrings" here and linked to the wrong hub there.
 *
 * The pose taxonomy is DELIBERATELY finer than the hub taxonomy: 13 buckets
 * against 8. A pose is one shape and can be precise about what it reaches; a
 * class is fifty minutes and reaches half a body. So the mapping is many-to-one
 * and that is expected — five hip-region buckets all point at the hips hub.
 */

export const POSE_AREA_BUCKETS = [
  { key: 'hips', label: 'Hips', match: (a: string) => /hips|outer hip/.test(a) },
  { key: 'glutes', label: 'Glutes', match: (a: string) => /glute/.test(a) },
  { key: 'hip-flexors', label: 'Hip flexors', match: (a: string) => /hip flexor/.test(a) },
  { key: 'quads', label: 'Quads', match: (a: string) => /quadricep|front of thigh/.test(a) },
  { key: 'hamstrings', label: 'Hamstrings', match: (a: string) => /hamstring/.test(a) },
  { key: 'it-band', label: 'IT band', match: (a: string) => /it band|iliotibial/.test(a) },
  { key: 'groin', label: 'Groin & inner thigh', match: (a: string) => /groin|inner thigh/.test(a) },
  {
    key: 'calves-feet',
    label: 'Calves & feet',
    match: (a: string) => /\bcalf\b|calves|ankle|shin|feet|foot|toe/.test(a),
  },
  { key: 'lower-back', label: 'Lower back', match: (a: string) => /lower back|low back|sacrum/.test(a) },
  { key: 'spine', label: 'Spine', match: (a: string) => /\bspine\b|side body|oblique|rib/.test(a) },
  { key: 'shoulders', label: 'Shoulders', match: (a: string) => /shoulder|upper back/.test(a) },
  { key: 'chest', label: 'Chest', match: (a: string) => /chest|pectoral|lung/.test(a) },
  { key: 'neck', label: 'Neck', match: (a: string) => /neck|throat/.test(a) },
] as const;

export type PoseAreaKey = (typeof POSE_AREA_BUCKETS)[number]['key'];

export const poseAreaKeys = (targetAreas: readonly string[]): PoseAreaKey[] => {
  const set = new Set<PoseAreaKey>();
  for (const raw of targetAreas) {
    const a = raw.toLowerCase();
    for (const b of POSE_AREA_BUCKETS) if (b.match(a)) set.add(b.key);
  }
  return [...set];
};

export const poseAreaLabel = (key: string) =>
  POSE_AREA_BUCKETS.find((b) => b.key === key)?.label ?? key;

/**
 * Pose area → class hub. Anatomy to anatomy, every time.
 *
 * The rule this follows, and the reason it is a table and not a judgement call:
 * a pose bucket maps to the hub covering the SAME PART OF THE BODY. It never
 * maps to an intent hub — "hamstrings" does not lead to "Yin for Sleep", because
 * nothing about a hamstring pose makes a sleep class the right next thing, and a
 * mapping no rule can justify is one nobody can maintain.
 *
 * `null` means "no honest hub for this yet". Those poses fall back to /videos
 * rather than being sent somewhere approximate.
 */
export const POSE_AREA_TO_HUB: Record<PoseAreaKey, string | null> = {
  // The hip region, five ways.
  hips: 'hips',
  glutes: 'hips',
  'hip-flexors': 'hips',
  groin: 'hips',
  'it-band': 'hips',
  // Below the hip — this is what the legs hub was added for. Before it existed
  // these four had nowhere honest to go.
  quads: 'legs',
  hamstrings: 'legs',
  'calves-feet': 'legs',
  // The back and up.
  'lower-back': 'lower-back',
  spine: 'lower-back',
  shoulders: 'shoulders',
  chest: 'shoulders',
  neck: 'shoulders',
};

/**
 * Fail the build if the mapping and the hubs have drifted apart.
 *
 * Two ways that happens: someone adds a pose bucket and forgets to map it, or
 * someone renames/removes a hub and the mapping keeps pointing at a key that no
 * longer builds a page. The second is the nastier one — it produces links to
 * 404s on 45 indexable pages, and nothing else would notice.
 */
export function assertPoseHubMapping(): void {
  const hubKeys = new Set([...FOCUS.map((f) => f.key), ...AUDIENCES.map((a) => a.key)]);
  const problems: string[] = [];

  for (const b of POSE_AREA_BUCKETS) {
    if (!(b.key in POSE_AREA_TO_HUB)) {
      problems.push(`pose area "${b.key}" has no entry in POSE_AREA_TO_HUB`);
    }
  }
  for (const [area, hub] of Object.entries(POSE_AREA_TO_HUB)) {
    if (hub === null) continue;
    if (!hubKeys.has(hub)) {
      problems.push(`pose area "${area}" maps to hub "${hub}", which is not a FOCUS or AUDIENCES key`);
    }
  }
  if (problems.length) {
    throw new Error(
      `Pose → hub mapping has drifted:\n${problems.map((p) => `  · ${p}`).join('\n')}\n` +
        `Fix POSE_AREA_TO_HUB in src/lib/poseFacets.ts.`,
    );
  }
}

/** The hubs a pose belongs to, deduped, in POSE_AREA_BUCKETS order. */
export function hubsForPose(targetAreas: readonly string[]) {
  assertPoseHubMapping();
  const keys = new Set<string>();
  for (const area of poseAreaKeys(targetAreas)) {
    const hub = POSE_AREA_TO_HUB[area];
    if (hub) keys.add(hub);
  }
  return [...keys].map((key) => {
    const f = FOCUS.find((x) => x.key === key);
    const a = AUDIENCES.find((x) => x.key === key);
    return { key, heading: (f?.heading ?? a?.heading)!.replace(/^Yin Yoga for /, '') };
  });
}
