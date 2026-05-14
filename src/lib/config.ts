export function apiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }
  return `${base}${p}`;
}
