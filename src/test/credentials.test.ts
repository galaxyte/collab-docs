import { describe, it, expect } from "vitest";
import { checkCredentials } from "@/lib/credentials";

describe("checkCredentials", () => {
  it("accepts a seeded email/password pair", () => {
    expect(checkCredentials("ava@example.com", "ava123")).toBe(true);
  });

  it("is case-insensitive on email but not on password", () => {
    expect(checkCredentials("AVA@EXAMPLE.COM", "ava123")).toBe(true);
    expect(checkCredentials("ava@example.com", "AVA123")).toBe(false);
  });

  it("rejects a wrong password for a known email", () => {
    expect(checkCredentials("ben@example.com", "ava123")).toBe(false);
  });

  it("rejects an email with no matching account", () => {
    expect(checkCredentials("stranger@example.com", "anything")).toBe(false);
  });
});
