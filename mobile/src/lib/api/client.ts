const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type ApiErrorResponse = { message?: string | string[] };

export async function apiGet<T>(path: string, searchParams?: Record<string, string>) {
  const url = new URL(path, API_URL);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    const message = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;
    throw new Error(message ?? 'İşlem şu an yapılamadı. Lütfen tekrar dene.');
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, accessToken?: string) {
  const response = await fetch(new URL(path, API_URL), { method: 'POST', headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify(body) });
  if (!response.ok) { const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null; throw new Error(Array.isArray(payload?.message) ? payload.message[0] : payload?.message ?? 'İşlem şu an yapılamadı.'); }
  return response.json() as Promise<T>;
}
