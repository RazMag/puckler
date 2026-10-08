import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Editor tokens are `<expiresAtMs>.<hmac>`: no user identity, just proof that
 * whoever holds it knew the crew password before `expiresAt`.
 */

const PURPOSE = "puckler-editor";

function sign(expiresAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`${PURPOSE}.${expiresAt}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Hash first so inputs of different lengths still compare in constant time.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function createToken(secret: string, expiresAt: number): string {
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifyToken(token: string | undefined, secret: string, now: number): boolean {
  if (!token) return false;
  const [rawExpiry, signature, ...rest] = token.split(".");
  if (!rawExpiry || !signature || rest.length > 0) return false;
  const expiresAt = Number(rawExpiry);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  return safeEqual(signature, sign(expiresAt, secret));
}

export function passwordMatches(candidate: string, expected: string): boolean {
  return safeEqual(candidate, expected);
}
