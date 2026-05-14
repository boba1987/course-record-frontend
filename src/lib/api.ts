import { apiUrl } from "@/lib/config";
import { clearAuthToken, getAuthTokenFromDocument } from "@/lib/auth-cookie";

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
  if (!skipAuth) {
    const token = getAuthTokenFromDocument();
    if (token) {
      h.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(apiUrl(path), { ...rest, headers: h });
  if (res.status === 401) {
    clearAuthToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
  const text = await res.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }
  if (!res.ok) {
    const msg =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : res.statusText;
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
