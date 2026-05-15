/** Decode JWT payload without verifying signature (client/middleware hint only). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewMs = 30_000): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return true;
  return exp * 1000 <= Date.now() + skewMs;
}

/** Seconds until JWT `exp`, or fallback when missing/invalid. */
export function jwtCookieMaxAgeSec(token: string, fallbackSec: number): number {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return fallbackSec;
  const remaining = Math.floor(exp - Date.now() / 1000);
  return remaining > 0 ? remaining : 0;
}
