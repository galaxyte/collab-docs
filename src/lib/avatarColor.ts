const PALETTE = [
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-violet-500", text: "text-white" },
  { bg: "bg-sky-500", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
  { bg: "bg-fuchsia-500", text: "text-white" },
] as const;

/** Deterministic color per user (by email) so the same person always gets the same avatar color. */
export function getAvatarColor(seed: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
