// Site-wide config. Update `membershipUrl` to Katie's real join/membership page —
// it's where members-only classes and membership CTAs point.
export const SITE = {
  // YouTube channel membership join page.
  membershipUrl: 'https://www.youtube.com/channel/UC3tO-lEyiexDPkN75ADTjCQ/join',

  // "Buy me a coffee" / tip link, shown in the footer. Paste your full URL here
  // (e.g. 'https://www.buymeacoffee.com/yourname' or a Ko-fi link). Leave '' to hide it.
  coffeeUrl: 'https://www.buymeacoffee.com/katiemcgrath',

  // MailerLite form POST URL for the "This Month" calendar weekly-reminder signup.
  // Create a MailerLite form/group for the calendar list, then paste its subscribe
  // URL here (same shape as the free-class one:
  // https://assets.mailerlite.com/jsonp/<account>/forms/<formId>/subscribe).
  // Leave '' and the signup box shows a "coming soon" note instead.
  calendarSignupAction: '',
};
