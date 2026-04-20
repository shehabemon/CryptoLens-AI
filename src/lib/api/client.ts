let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include", // Send httpOnly cookie
    });

    if (!res.ok) {
      accessToken = null;
      return null;
    }

    const data = await res.json();
    accessToken = data.accessToken;
    return accessToken;
  } catch {
    accessToken = null;
    return null;
  }
}


function getRefreshPromise(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface ApiOptions extends RequestInit {
  /** If true, skip auth header (for public endpoints) */
  public?: boolean;
}

export async function apiFetch(
  url: string,
  options: ApiOptions = {}
): Promise<Response> {
  const { public: isPublic, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  if (!isPublic && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (!headers.has("Content-Type") && fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...fetchOptions,
    headers,
    credentials: "include", // Always send cookies for refresh token
  });

  // If 401 and not a public request, try to refresh
  if (response.status === 401 && !isPublic) {
    const newToken = await getRefreshPromise();

    if (newToken) {
      // Retry the original request with the new token
      headers.set("Authorization", `Bearer ${newToken}`);
      return fetch(`${BASE_URL}${url}`, {
        ...fetchOptions,
        headers,
        credentials: "include",
      });
    }
  }

  return response;
}

/**
 * Convenience wrapper that parses JSON and throws on error
 */
export async function apiJson<T>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const res = await apiFetch(url, options);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || `Request failed: ${res.status}`, body.errors);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}
