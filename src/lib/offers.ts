/**
 * The two email offers, shared by the CTA's markup and its client script.
 *
 * One copy of the strings, because both sides need them: the page renders an
 * offer at build time, and a visitor arriving from Strava has the runner offer
 * swapped in on load (see Cta.astro). Keeping the map here is what stops the
 * two from drifting into different wording or, worse, different form actions.
 *
 * They post to different MailerLite forms on purpose: each triggers its own
 * automation, so a runner must not be dropped into the retreat series.
 */
export const OFFERS = {
  retreat: {
    action: 'https://assets.mailerlite.com/jsonp/2503148/forms/192665473777665865/subscribe',
    eyebrow: 'A gift from me',
    heading: 'Two hours to completely switch off',
    body: "Pop your email in and I'll send you my free two-hour Yin, restorative and Yoga Nidra retreat — two slow hours to properly switch off. Yours to keep, and to come back to any time.",
    badge: '✦ A members-only class — free for you',
    button: 'Send me the free retreat →',
    done: 'Check your inbox 🌙 your two-hour retreat is on its way.',
    aria: 'Get the free two-hour retreat',
  },
  runners: {
    action: 'https://assets.mailerlite.com/jsonp/2503148/forms/194288582398052179/subscribe',
    eyebrow: 'Free for runners',
    heading: 'The 15-Minute Post-Run Reset',
    body: "Pop your email in and I'll send you a free follow-along Yin class for after your run — fifteen quiet minutes to loosen what running tightens, from the hips and glutes to the hamstrings and spine. Yours to keep, for any run, forever.",
    badge: '✦ A free follow-along class, with a hold timer',
    button: 'Send me the Post-Run Reset →',
    done: 'Check your inbox 🌙 your Post-Run Reset is on its way.',
    aria: 'Get the free Post-Run Reset',
  },
} as const;

export type OfferKey = keyof typeof OFFERS;
