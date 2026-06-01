import { getAccessToken } from "@/lib/auth";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getBackendUrl(): string {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/+$/, "");
}

export async function apiGet<T>(path: string): Promise<T> {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    throw new ApiError("Brak adresu backendu w NEXT_PUBLIC_BACKEND_URL.");
  }

  const token = getAccessToken();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${backendUrl}${path}`, { headers });

  if (!response.ok) {
    throw new ApiError(`Nie udało się pobrać danych (${response.status}).`, response.status);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    throw new ApiError("Brak adresu backendu w NEXT_PUBLIC_BACKEND_URL.");
  }

  const token = getAccessToken();
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${backendUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(`Błąd zapisu danych: ${response.status} ${errorText}`, response.status);
  }

  return response.json();
}
