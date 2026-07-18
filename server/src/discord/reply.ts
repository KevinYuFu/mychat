const DISCORD_LIMIT = 2000;

/**
 * Split a reply into Discord-sized chunks (<= 2000 chars), preferring to break
 * on a newline so we don't cut mid-sentence.
 */
export function chunkMessage(text: string, limit = DISCORD_LIMIT): string[] {
  if (text.length <= limit) return [text];

  const parts: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n", limit);
    if (cut < limit * 0.5) cut = limit; // no good newline — hard cut
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, "");
  }
  if (rest) parts.push(rest);
  return parts;
}
