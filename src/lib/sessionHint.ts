/**
 * Is someone probably signed in? Answered synchronously, without loading the
 * Supabase SDK, so the ~700 prerendered public pages can decide whether the
 * account-aware bits (nav swap, sales-page redirect) are worth a dynamic import.
 *
 * Two hints: the short-lived `sb-token` bridge cookie (see supabaseBrowser.ts,
 * written on auth changes, one-hour TTL), and the session Supabase itself keeps
 * in localStorage under `sb-<project>-auth-token`, which persists and refreshes
 * for as long as the person stays signed in. The cookie alone was the original
 * gate, and it expired an hour after the last course visit — so the nav forgot
 * members on the public site and even on the account page itself.
 *
 * A hint, not a verdict: the caller still asks Supabase for the real session.
 */
export function hasSessionHint(): boolean {
  try {
    if (/(?:^|;\s*)sb-token=/.test(document.cookie)) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (/^sb-.*-auth-token$/.test(k)) return true;
    }
  } catch {}
  return false;
}
