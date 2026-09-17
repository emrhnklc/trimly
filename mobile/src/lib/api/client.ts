const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export function resolveApiUrl(path: string) {
  return new URL(path, API_URL).toString();
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

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;
    const isServerFailure = response.status >= 500;
    const isGenericServerMessage = !message || /^internal server error$/i.test(message);
    const userMessage = isServerFailure && isGenericServerMessage
      ? "Sunucuya şu an ulaşılamıyor. Lütfen biraz sonra tekrar dene."
      : message ?? "İşlem şu an yapılamadı. Lütfen tekrar dene.";

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

export async function apiGet<T>(
  path: string,
  searchParams?: Record<string, string>,
  accessToken?: string,
) {
  const url = new URL(path, API_URL);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  accessToken?: string,
) {
  const response = await fetch(new URL(path, API_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function apiUpload<T>(
  path: string,
  body: FormData,
  accessToken?: string,
) {
  const response = await fetch(new URL(path, API_URL), {
    method: "POST",
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
    body,
  });

  return parseResponse<T>(response);
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  accessToken?: string,
) {
  const hasBody = body !== undefined;
  const response = await fetch(new URL(path, API_URL), {
    method: "PATCH",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  accessToken?: string,
) {
  const hasBody = body !== undefined;
  const response = await fetch(new URL(path, API_URL), {
    method: "PUT",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiDelete<T>(
  path: string,
  accessToken?: string,
  body?: unknown,
) {
  const hasBody = body !== undefined;
  const response = await fetch(new URL(path, API_URL), {
    method: "DELETE",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}
