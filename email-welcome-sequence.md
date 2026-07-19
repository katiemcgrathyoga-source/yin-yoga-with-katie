# Welcome email sequence — Yin Yoga with Katie

The automated emails a new subscriber receives after signing up for the free
two-hour retreat. Written in Katie's real voice (from her class transcripts):
warm, plain, gentle, permission-giving. No hype, no pet names, no big medical
claims, no forcing. Short, additive sentences. Sign-off is always *"take good
care of yourself."*

---

## Setup in MailerLite (one-time)

1. **Add a custom field** named `signup_source` (type: text). The site now sends
   a hidden `signup_source` on every form (`home-retreat`, `free-class-page`,
   `journal`, `pose`, `routine`, `program`, `video`) so you can see *which pages*
   grow the list. In MailerLite → Subscribers → Fields → add it, then segment or
   sort by it.
2. **Set a name fallback.** The homepage band collects email only, so some
   subscribers have no first name. Use `{$name|default:"there"}` everywhere so it
   never reads "Hi ,". (In MailerLite the merge tag is `{$name}`; add the default
   in the personalization dialog.)
3. **Retreat link** is already wired in below (`https://youtu.be/vRjBfrLC4Dg`) —
   swap it only if the unlisted video URL ever changes.
4. **Build the automation:** Trigger = *subscriber joins the form/group*.
   - Email 1 — send immediately
   - wait 2 days → Email 2
   - wait 2 days → Email 3
   - wait 3 days → Email 4

Links to use: retreat = `https://youtu.be/vRjBfrLC4Dg`; bedtime wind-down =
`https://yinyogawithkatie.com/routines/bedtime-wind-down`; programs =
`https://yinyogawithkatie.com/programs`; poses =
`https://yinyogawithkatie.com/poses`; library =
`https://yinyogawithkatie.com/`.

---

## Email 1 — immediately · deliver the retreat

**Subject:** Your two-hour retreat is here 🌙
**Preview:** Two hours of Yin, restorative and Yoga Nidra — yours to keep.

Hi {$name|default:"there"},

Thank you so much for being here. As promised, here's your free two-hour retreat —
a slow, gentle journey through Yin, restorative yoga and Yoga Nidra. It's yours to
keep, and to come back to any time.

**▶ [Start your two-hour retreat](https://youtu.be/vRjBfrLC4Dg)**

There's nothing to keep up with, and no way to get it wrong. Find a quiet, warm
spot, grab a cushion or two, and press play whenever you're ready. If you need to
come out of anything sooner, that's completely okay — you don't need to wait for me.

We only ever aim for about 80% of your capacity, so let your breath and gravity do
the work. Nothing forced.

I'll write again in a day or two with a few gentle things that help.

Until then, take good care of yourself.

Katie 🌙
*Yin Yoga with Katie*

P.S. Keep this email so you can find your retreat whenever you need it.

---

## Email 2 — day 2 · a proper hello + how to practise

**Subject:** There's no right or wrong here
**Preview:** A few gentle things that help when you're starting Yin.

Hi {$name|default:"there"},

I wanted to say a proper hello. I'm Katie — I teach Yin Yoga from my home, and my
hope is simply to make yoga free and available to anyone who might need it.

If Yin is new to you, a few things that help:

- We stay in each pose for a few minutes at a time. It can feel like a lot at
  first — that's completely normal.
- Aim for about 80% of your capacity, never more. Yin isn't about how deep you go.
- Your mind will wander. That's normal too. As soon as you notice you're thinking,
  just come gently back to your breath.
- If something doesn't feel right, come out of it. You're always your own teacher
  here.

Everybody is different — every body, literally, is different — so take whatever
works for you and leave the rest.

Whenever you're ready, your two-hour retreat is [right here](https://youtu.be/vRjBfrLC4Dg).

Take good care of yourself,
Katie

---

## Email 3 — day 4 · a small, easy win

**Subject:** Ten quiet minutes tonight?
**Preview:** A short, slow practice for the hour before bed.

Hi {$name|default:"there"},

If two hours feels like a lot this week, that's okay — little and often does far
more than long and rare.

If you're finding it hard to switch off at night, you might try this gentle
[bedtime wind-down](https://yinyogawithkatie.com/routines/bedtime-wind-down).
It's short, it's slow, and you can do it right on your bed.

Dim the lights, get warm, put your phone in another room if you can, and just
settle. Nowhere to be, nothing to keep up with.

Take good care,
Katie

---

## Email 4 — day 8 · where to go from here

**Subject:** Where to go from here
**Preview:** Programs, poses and a whole library to explore, whenever you like.

Hi {$name|default:"there"},

By now I hope Yin is starting to feel like a small, kind part of your week.

Whenever you'd like more, everything I make is free and waiting for you:

- [Programs](https://yinyogawithkatie.com/programs) — gentle paths to follow, like
  the Bedtime Reset, if you like a little structure.
- [The pose library](https://yinyogawithkatie.com/poses) — every shape, with cues
  and how long to hold it.
- [The class library](https://yinyogawithkatie.com/) — over 300 practices; filter
  for whatever your body needs today.

I truly love Yin, and I love getting to share it with you. If you'd ever like to
help me keep it free for everyone, becoming a member is the kindest way to support
the channel — but there's never any pressure. Practising with me is more than
enough.

I'll see you again soon on the mat.

Take good care of yourself,
Katie 🌙
