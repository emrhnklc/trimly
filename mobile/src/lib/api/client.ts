const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const DEFAULT_GET_CACHE_MS = 30_000;

type CachedResponse = {
  expiresAt: number;
  value: unknown;
};

type ApiGetOptions = {
  cacheTimeMs?: number;
  fresh?: boolean;
};

const responseCache = new Map<string, CachedResponse>();
const pendingRequests = new Map<string, Promise<unknown>>();
let cacheGeneration = 0;

export function resolveApiUrl(path: string) {
  const resolved = new URL(path, API_URL);
  if (isPersistedLocalAssetUrl(resolved)) {
    return new URL(
      `${resolved.pathname}${resolved.search}${resolved.hash}`,
      API_URL,
    ).toString();
  }
  return resolved.toString();
}

function isPersistedLocalAssetUrl(url: URL) {
  const isTrimlyAsset =
    url.pathname.startsWith('/barbershops/images/') ||
    url.pathname.startsWith('/users/profile-images/');
  if (!isTrimlyAsset) return false;

  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
  const octets = url.hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
    return false;
  }

  return (
    octets[0] === 10 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  );
}

type ApiErrorResponse = {
  code?: string;
  message?: string | string[];
  requestId?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly requestId?: string,
    readonly endpoint?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi(url: URL, options: RequestInit) {
  try {
    return await fetch(url, options);
  } catch {
    throw new ApiError(
      "Bağlantı sorunu: Trimly sunucusuna ulaşılamıyor. İnternet bağlantını kontrol edip tekrar dene. Sorun devam ederse sunucu geçici olarak erişilemiyor olabilir.",
      0,
      "NETWORK_ERROR",
      undefined,
      url.toString(),
    );
  }
}

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;
    const isServerFailure = response.status >= 500;
    const isGenericServerMessage =
      !message || /^internal server error$/i.test(message);
    const userMessage =
      isServerFailure && isGenericServerMessage
        ? "Sunucuya şu an ulaşılamıyor. Lütfen biraz sonra tekrar dene."
        : (message ?? "İşlem şu an yapılamadı. Lütfen tekrar dene.");

    throw new ApiError(
      userMessage,
      response.status,
      payload?.code,
      payload?.requestId ?? response.headers.get("x-request-id") ?? undefined,
      response.url,
    );
  }

  return response.json() as Promise<T>;
}

export function isApiErrorCode(
  reason: unknown,
  code: string,
): reason is ApiError {
  return reason instanceof ApiError && reason.code === code;
}

export function clearApiCache() {
  cacheGeneration += 1;
  responseCache.clear();
  pendingRequests.clear();
}

export async function apiGet<T>(
  path: string,
  searchParams?: Record<string, string>,
  accessToken?: string,
  options?: ApiGetOptions,
) {
  const url = new URL(path, API_URL);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  if (options?.fresh) {
    const response = await fetchApi(url, {
      cache: "no-store",
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });
    return parseResponse<T>(response);
  }

  const cacheKey = `${accessToken ?? "public"}:${url.toString()}`;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const pending = pendingRequests.get(cacheKey);
  if (pending) return pending as Promise<T>;

  const requestGeneration = cacheGeneration;
  const request = fetchApi(url, {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  })
    .then((response) => parseResponse<T>(response))
    .then((value) => {
      if (requestGeneration === cacheGeneration) {
        responseCache.set(cacheKey, {
          expiresAt:
            Date.now() + (options?.cacheTimeMs ?? DEFAULT_GET_CACHE_MS),
          value,
        });
      }
      return value;
    })
    .finally(() => {
      if (pendingRequests.get(cacheKey) === request)
        pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);
  return request;
}

async function parseMutationResponse<T>(response: Response) {
  const value = await parseResponse<T>(response);
  clearApiCache();
  return value;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  accessToken?: string,
) {
  const response = await fetchApi(new URL(path, API_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  return parseMutationResponse<T>(response);
}

export async function apiUpload<T>(
  path: string,
  body: FormData,
  accessToken?: string,
) {
  const response = await fetchApi(new URL(path, API_URL), {
    method: "POST",
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
    body,
  });

  return parseMutationResponse<T>(response);
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  accessToken?: string,
) {
  const hasBody = body !== undefined;
  const response = await fetchApi(new URL(path, API_URL), {
    method: "PATCH",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  return parseMutationResponse<T>(response);
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  accessToken?: string,
) {
  const hasBody = body !== undefined;
  const response = await fetchApi(new URL(path, API_URL), {
    method: "PUT",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  return parseMutationResponse<T>(response);
}

export async function apiDelete<T>(
  path: string,
  accessToken?: string,
  body?: unknown,
) {
  const hasBody = body !== undefined;
  const response = await fetchApi(new URL(path, API_URL), {
    method: "DELETE",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  return parseMutationResponse<T>(response);
}
