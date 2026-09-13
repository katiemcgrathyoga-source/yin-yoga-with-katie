# Deliverable D — Buyer Welcome Email (The Runner's Reset)

> **This file is the load-ready source for the `Runners — Buyers` automation
> (trigger: subscriber joins the buyers group, which the Polar webhook does the
> moment an order is paid).** It is the "welcome/onboarding email" that
> `C-nurture-and-launch-emails.md` says to send after tagging a buyer — nothing
> else in the pack covers it. One email, sent immediately. Merge tag
> `{$name|default:"there"}`. **No emoji.**
>
> Its one job is to make the course findable again on any device, any day:
> **the course lives behind Sign in at `https://yinyogawithkatie.com/account`.**
> That is the only route that works everywhere — the nav link only points at the
> course while someone is signed in on that browser, and the sales page cannot be
> the way in. Every other link in this email is secondary.

---

## Email 1 · immediately — where your course lives

**Subject:** Your Runner's Reset — and how to find it again

**Preview text:** Bookmark this one. It's your way back in on any device.

Hi {$name|default:"there"},

Thank you for joining The Runner's Reset. I'm really glad you're here.

Before anything else, the practical bit — because this is the email you'll want to find again.

**Your course lives here: [yinyogawithkatie.com/account](https://yinyogawithkatie.com/account)**

There's no password. Enter the same email you used at checkout ({$email}) and I'll send you a one-tap link that signs you in. Once you're in, the Runner's Reset link at the top of every page on the site takes you straight to your practices, and you can use it from your phone, your laptop, whichever is nearest the mat.

If you ever land on the sales page instead — a new phone, a different browser — you're just signed out. Tap **Sign in** at the top of the page, or the "Already joined?" line under the big button, and you're back in.

Two things that make it easier still:

- **Add it to your home screen.** Open [yinyogawithkatie.com/practices](https://yinyogawithkatie.com/practices) on your phone, then use your browser's Share or menu button and choose Add to Home Screen. It opens like an app, no address bar.
- **Start with Start Here.** It's a short welcome: what Yin is, why it suits runners, and which practice to press play on first depending on what's tight today. Then let the library do the rest.

That's it for now. Nothing to study, nothing to plan. When your legs next feel heavy, sign in, pick the practice that matches, and give yourself fifteen minutes on the floor.

Take good care of yourself,
Katie

P.S. Your receipt comes separately from Polar, our payment provider. Keep this email for the sign-in link; keep that one for the money.

---

## Polar receipt — one-time setup

The buy buttons on the sales page link straight to the Polar checkout link, so
the receipt and the "success" page are Polar's, not ours. Two settings in the
Polar dashboard make the receipt point back to the course:

1. **Checkout link → Success URL:** set to
   `https://yinyogawithkatie.com/account?purchased=1` so the buyer lands on the
   sign-in form with the thank-you note, the same place the API checkout already
   sends them (see `netlify/functions/create-checkout.mjs`).
2. **Benefits → New Benefit → type "Custom"**, attached to the $49 product. The
   product **Description** only shows on the checkout page; a Custom benefit's
   **Private note** is rendered on the success page, in the purchase confirmation
   email, and in the customer portal (per Polar docs). Description (the title the
   buyer sees): *Where your course lives*. Private note (Markdown):
   *"Your course lives at [yinyogawithkatie.com/account](https://yinyogawithkatie.com/account).
   Sign in with this email and we'll send you a one-tap link — no password."*

Both are dashboard changes, not code. Until they're done, the MailerLite email
above is the only place a buyer is told where the course is.
