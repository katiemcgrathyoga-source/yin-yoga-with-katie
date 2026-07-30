// Site-wide config. Update `membershipUrl` to Katie's real join/membership page —
// it's where members-only classes and membership CTAs point.
export const SITE = {
  // YouTube channel membership join page.
  membershipUrl: 'https://www.youtube.com/channel/UC3tO-lEyiexDPkN75ADTjCQ/join',

  // How the course (The Runner's Reset) is chromed, so it reads as its own space
  // rather than another page of the public site. Flip this one value to switch:
  //   'focused'  — deep sage bar, tight chrome, minimal footer. A practice mode.
  //   'familiar' — Katie's normal palette; only the nav and footer differ.
  // Everything else (colors, type, components) is shared either way.
  courseChrome: 'focused' as 'focused' | 'familiar',

  // "Buy me a coffee" / tip link, shown in the footer. Paste your full URL here
  // (e.g. 'https://www.buymeacoffee.com/yourname' or a Ko-fi link). Leave '' to hide it.
  coffeeUrl: 'https://www.buymeacoffee.com/katiemcgrath',

  // Social + newsletter links, shown as icons in the footer. Set any to '' to hide it.
  // Substack is Katie's writing/newsletter home; the site's email list stays on MailerLite.
  socials: {
    substack: 'https://katiemcgrathyoga.substack.com/',
    instagram: 'https://www.instagram.com/yinyogawithkatie/',
    tiktok: 'https://www.tiktok.com/@yoga.with.katie',
    pinterest: 'https://www.pinterest.com/YinYogaWithKatie',
    youtube: 'https://www.youtube.com/@YinYogawithKatie',
  },
};
