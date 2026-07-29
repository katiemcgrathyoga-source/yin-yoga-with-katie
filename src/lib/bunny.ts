import { createHash } from 'node:crypto';

/**
 * Server-side Bunny Stream embed signer. KEEP IN SYNC with the parallel copy in
 * netlify/functions/bunny-playback.mjs (same token formula; the esbuild/Vite
 * boundary prevents sharing one module). Used by the SSR session page to embed a signed player
 * directly for owners (so the URL is minted server-side, never guessable).
 * Returns null when Bunny isn't configured or there's no video id.
 */
export function signBunnyEmbed(videoId: string): string | null {
  const lib = process.env.BUNNY_STREAM_LIBRARY_ID;
  const key = process.env.BUNNY_STREAM_TOKEN_KEY;
  const ttl = Number(process.env.BUNNY_STREAM_TTL || 3600);
  if (!lib || !key || !videoId) return null;
  const expires = Math.floor(Date.now() / 1000) + ttl;
  const token = createHash('sha256').update(key + videoId + expires).digest('hex');
  return `https://iframe.mediadelivery.net/embed/${lib}/${videoId}?token=${token}&expires=${expires}`;
}
