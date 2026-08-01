# Auth emails

Two templates and the SMTP setup behind them. These are the only emails Supabase
sends for this site — magic-link sign-in is the entire auth system, so if they
don't arrive, a paying member cannot watch anything they bought.

## Do the SMTP first — the templates are locked until you do

Supabase will not let you edit a template's subject or body while you are on its
built-in sender. The editor shows "Set up custom SMTP to edit templates" and the
fields are read-only. It is an anti-abuse measure, and it means the order is:

**Resend → DNS → Supabase SMTP → then paste these templates.**

## Where each one goes

Supabase → **Authentication → Email Templates**

| Template | File | Subject |
|---|---|---|
| Magic Link | `magic-link.html` | `Your sign-in link` |
| Confirm signup | `confirm-signup.html` | `Confirm your email` |

**Do both.** `signInWithOtp` sends **Confirm signup** — not Magic Link — whenever
the address has never signed in before. Template only the obvious one and every
first-time visitor, including every new buyer, meets Supabase's unbranded default
on their first contact with the product.

Ignore the rest (Invite, Change Email, Reset Password); nothing here triggers them.

## Why the HTML looks like 2004

Email is not the web. Layout is tables, styles are inline, there is no external
stylesheet and no web fonts. Georgia stands in for the site's serif because it's
installed nearly everywhere. The button is a `bgcolor` on a table cell rather
than a styled anchor, because Outlook ignores `background-color` on links.

No images, deliberately: most clients block them by default, and a broken logo
looks worse than clean type.

The button is rosewood `#89494B` with cream `#F9F1EA` text — 6.03:1. Rosewood
rather than the sage, because sage is the site's *structural* colour and a sage
button reads as furniture rather than the thing to press.

---

## SMTP — Resend on a subdomain

Supabase's built-in mailer is rate-limited to a handful an hour and is shared
infrastructure. Fine for development; not something to leave between a customer
and the product they paid for.

**Subdomain, not the root.** Auth mail goes from `notifications.yinyogawithkatie.com`
so its reputation is isolated from MailerLite's marketing sends on the root
domain. A campaign that collects complaints then can't take the magic links down
with it, and those are the emails that absolutely must arrive.

### 1 · Resend

Sign up, **Domains → Add Domain**, enter `notifications.yinyogawithkatie.com`.
It returns DKIM and SPF records to publish.

### 2 · DNS

DNS is on **Cloudflare** — nameservers `gannon.ns.cloudflare.com` and
`raina.ns.cloudflare.com`. Add the records under the `yinyogawithkatie.com` zone,
naming them relative to it (`send.notifications`, `resend._domainkey.notifications`).

> **Cloudflare gotcha:** any CNAME Resend asks for must be set to **DNS only**
> (grey cloud), not Proxied. A proxied CNAME breaks verification. TXT and MX
> records are never proxied, so they need no attention.

> **The one that bites:** a domain may have only **one** SPF record. Because the
> sender here is a *subdomain*, it gets its own SPF and there's no clash with
> MailerLite's on the root — which is a second reason to use one.
>
> If you later add Resend to the **root** domain as well, merge the include into
> the existing record rather than adding a second. The root currently reads
> `v=spf1 a mx include:_spf.mlsend.com ~all`, so it would become
> `v=spf1 a mx include:_spf.mlsend.com include:amazonses.com ~all`
> Two SPF records is a hard fail — worse than having none.

DKIM uses a unique selector per provider, so those never collide.

### 3 · Verify, then get credentials

Wait for Resend to show the domain **Verified** (usually minutes; DNS can take
longer). Then create an API key — that key is the SMTP password.

```
Host      smtp.resend.com
Port      587
Username  resend
Password  <your API key>
Sender    katie@notifications.yinyogawithkatie.com
Name      Yin Yoga with Katie
```

Sender *name* matters. "Yin Yoga with Katie" reads as a person; "noreply" reads
as a machine and gets filed like one.

### 4 · Supabase

**Project Settings → Authentication → SMTP Settings.** Enable custom SMTP and
enter the above.

### 5 · Raise the rate limit

**Authentication → Rate Limits.** The low cap exists *because* you were on the
shared service. Switching to custom SMTP does not lift it by itself, and this is
the step people skip before wondering why sign-in still throttles.

### 6 · Check it end to end

Sign out, request a link, and confirm three things: it arrives, it comes from the
subdomain, and it lands somewhere findable. Resend's dashboard logs every send,
which beats guessing.
