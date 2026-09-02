/**
 * Hardcoded demo credentials for the mocked login gate. Intentionally not
 * real auth (no hashing, no real session security) — see AI_USAGE.md /
 * ARCHITECTURE.md for why that's an acceptable tradeoff for this exercise.
 */
export const DEMO_CREDENTIALS: Record<string, string> = {
  "ava@example.com": "ava123",
  "ben@example.com": "ben123",
  "cara@example.com": "cara123",
};

export function checkCredentials(email: string, password: string): boolean {
  const expected = DEMO_CREDENTIALS[email.toLowerCase().trim()];
  return expected !== undefined && expected === password;
}
