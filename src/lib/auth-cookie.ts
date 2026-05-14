const COOKIE = "cr_access_token";
const MAX_AGE_SEC = 60 * 60 * 12; // 12h; align with JWT expiry in backend if needed

export function setAuthToken(token: string) {
  if (typeof document === "undefined") return;
  const enc = encodeURIComponent(token);
  document.cookie = `${COOKIE}=${enc}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax`;
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
