const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function resolveApiUrl(path: string) {
  return new URL(path, API_URL).toString();
}

type ApiErrorResponse = { message?: string | string[] };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseResponse<T>(response: Response) {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;

    throw new ApiError(
      message ?? 'İşlem şu an yapılamadı. Lütfen tekrar dene.',
      response.status,
    );
  }

  return response.json() as Promise<T>;
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
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown, accessToken?: string) {
  const response = await fetch(new URL(path, API_URL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function apiPatch<T>(path: string, body?: unknown, accessToken?: string) {
  const hasBody = body !== undefined;
  const response = await fetch(new URL(path, API_URL), {
    method: 'PATCH',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiPut<T>(path: string, body?: unknown, accessToken?: string) {
  const hasBody = body !== undefined;
  const response = await fetch(new URL(path, API_URL), {
    method: 'PUT',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string, accessToken?: string) {
  const response = await fetch(new URL(path, API_URL), {
    method: 'DELETE',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  return parseResponse<T>(response);
}
