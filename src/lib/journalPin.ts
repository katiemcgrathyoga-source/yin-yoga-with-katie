/**
 * Journal Pin URL builder — points at the `/pin/journal.png` serverless function
 * (netlify/functions/journal-pin.mjs), which renders the four-variant 1000×1500
 * Pinterest pin from the `design_handoff_pinterest_pins` handoff.
 *
 * One canonical variant per page powers og:image (so "Pin it" / Rich Pins grab a
 * tall, on-brand image); the pin console offers all four for manual scheduling.
 *
 * Content rules from the handoff, enforced by callers:
 *   • meta must never reveal an exact hold time — say "Long hold", not "3–5 min".
 *   • excerpt teases the payoff, it never gives the full answer.
 *   • photos render at natural aspect (the function never crops the subject).
 */
export type JournalVariant = 'arch' | 'oat-frame' | 'split' | 'card';

export interface JournalPinOptions {
  variant?: JournalVariant;
  title: string;
  /** Small tracked-caps label: "From the journal" · "Pose library" · "Routines" · "The library". */
  eyebrow?: string;
  /** Uppercase tracked line, e.g. "Long hold · hips" or "30 minutes · all levels". Optional. */
  meta?: string;
  /** 1–2 line benefit/teaser. Optional. */
  excerpt?: string;
  /** Root-relative or absolute photo path; omitted → text-only pin. */
  photo?: string | null;
  footer?: 'url' | 'wordmark';
}

export function journalPinUrl(site: URL | string | undefined, o: JournalPinOptions): string {
  const u = new URL('/pin/journal.png', site);
  u.searchParams.set('variant', o.variant ?? 'arch');
  u.searchParams.set('t', o.title);
  if (o.eyebrow != null) u.searchParams.set('s', o.eyebrow);
  if (o.meta) u.searchParams.set('meta', o.meta);
  if (o.excerpt) u.searchParams.set('ex', o.excerpt);
  if (o.photo) u.searchParams.set('img', o.photo);
  if (o.footer) u.searchParams.set('footer', o.footer);
  return u.href;
}

/** All four variants for a page, for the pinning console (variant → pin URL). */
export function journalPinVariants(
  site: URL | string | undefined,
  o: Omit<JournalPinOptions, 'variant'>,
): Record<JournalVariant, string> {
  const variants: JournalVariant[] = ['arch', 'oat-frame', 'split', 'card'];
  return Object.fromEntries(
    variants.map((variant) => [variant, journalPinUrl(site, { ...o, variant })]),
  ) as Record<JournalVariant, string>;
}
