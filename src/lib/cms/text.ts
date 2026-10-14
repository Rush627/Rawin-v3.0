/** Small text helpers shared by server and client components. */

/**
 * Splits the closing invitation at its *emphasised* word: before / emphasis / after. Without
 * markers nothing is emphasised. Phones break the line just before the emphasis.
 */
export function splitEmphasis(text: string): { before: string; emphasis: string; after: string } {
  const m = /^([\s\S]*?)\*([^*]+)\*([\s\S]*)$/.exec(text);
  if (!m) return { before: text.replace(/\*/g, ""), emphasis: "", after: "" };
  return { before: m[1].replace(/\*/g, "").trimEnd(), emphasis: m[2].trim(), after: m[3].replace(/\*/g, "") };
}
