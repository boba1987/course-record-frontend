import { jwtCookieMaxAgeSec } from "@/lib/jwt";

const COOKIE = "cr_access_token";
/** Fallback when JWT has no `exp` (backend default is 1h). */
const FALLBACK_MAX_AGE_SEC = 60 * 60;

export function setAuthToken(token: string) {
  if (typeof document === "undefined") return;
  const maxAge = jwtCookieMaxAgeSec(token, FALLBACK_MAX_AGE_SEC);
  if (maxAge <= 0) return;
  const enc = encodeURIComponent(token);
  document.cookie = `${COOKIE}=${enc}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearAuthToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAuthTokenFromDocument(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE}=([^;]*)`),
  );
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export { COOKIE as AUTH_COOKIE_NAME };
