import { describe, expect, it } from "vitest";
import { createToken, passwordMatches, verifyToken } from "./token";

describe("editor token", () => {
  const now = 1_000_000;

  it("accepts a fresh token signed with the same secret", () => {
    expect(verifyToken(createToken("s3cret", now + 1000), "s3cret", now)).toBe(true);
  });

  it("rejects expired, tampered, foreign or malformed tokens", () => {
    const token = createToken("s3cret", now + 1000);
    expect(verifyToken(token, "s3cret", now + 1000)).toBe(false);
    expect(verifyToken(token.replace(/^\d+/, String(now + 9_999_999)), "s3cret", now)).toBe(false);
    expect(verifyToken(token, "other", now)).toBe(false);
    expect(verifyToken("nope", "s3cret", now)).toBe(false);
    expect(verifyToken(undefined, "s3cret", now)).toBe(false);
  });

  it("compares passwords exactly", () => {
    expect(passwordMatches("hat trick", "hat trick")).toBe(true);
    expect(passwordMatches("hat trick ", "hat trick")).toBe(false);
  });
});
