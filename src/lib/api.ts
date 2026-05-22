import { apiUrl } from "@/lib/config";
import { clearAuthToken, getAuthTokenFromDocument } from "@/lib/auth-cookie";

/** Matches backend `spring.data.web.pageable.max-page-size` for dropdown option lists. */
export const LIST_OPTS_PAGE_SIZE = 100;

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type FetchOptions = RequestInit & {
  /** Skip attaching Authorization (e.g. login) */
  skipAuth?: boolean;
};

/** True when the JWT still works on a known secured route (avoids logout on 401 from missing/old endpoints). */
async function isAuthSessionValid(token: string): Promise<boolean> {
  try {
    const res = await fetch(
      apiUrl(`/api/professors${buildListQuery({ page: 0, size: 1 })}`),
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    );
    return res.status !== 401;
  } catch {
    return true;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const h = new Headers(headers);
  if (!h.has("Accept")) h.set("Accept", "application/json");
  const body = rest.body;
  if (body && !(body instanceof FormData) && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }
  let authToken: string | null = null;
  if (!skipAuth) {
    authToken = getAuthTokenFromDocument();
    if (authToken) {
      h.set("Authorization", `Bearer ${authToken}`);
    }
  }

  const res = await fetch(apiUrl(path), { ...rest, headers: h });
  const text = await res.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  // Only a truly expired/invalid session should clear auth and redirect. Login failures are
  // also 401 but must not reload /login. Unknown API paths on an old backend also return 401.
  let sessionStillValid: boolean | null = null;
  if (res.status === 401 && !skipAuth && authToken) {
    sessionStillValid = await isAuthSessionValid(authToken);
    if (!sessionStillValid) {
      clearAuthToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  }

  if (!res.ok) {
    const msg =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : res.statusText;
    if (res.status === 401 && sessionStillValid) {
      throw new ApiError(
        "API returned unauthorized for this path. Restart the backend so it exposes the current routes (e.g. /api/study-programs).",
        res.status,
        json,
      );
    }
    throw new ApiError(msg || "Request failed", res.status, json);
  }
  return json as T;
}

export type ListQueryParams = {
  page?: number;
  size?: number;
  sort?: string;
  /** Server-side list filters; empty strings are omitted */
  filters?: Record<string, string>;
};

export function buildListQuery(params: ListQueryParams): string {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.size !== undefined) sp.set("size", String(params.size));
  if (params.sort) sp.set("sort", params.sort);
  if (params.filters) {
    for (const [key, raw] of Object.entries(params.filters)) {
      const v = raw.trim();
      if (v) sp.set(key, v);
    }
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}
