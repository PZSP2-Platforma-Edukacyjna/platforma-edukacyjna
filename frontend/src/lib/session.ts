import { getAccessToken } from "@/lib/auth";

export type AccessTokenPayload = {
  exp?: number;
  iat?: number;
  jti?: string;
  token_type?: string;
  user_id?: number;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = window.atob(padded);

  return decodeURIComponent(
    Array.from(decoded, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
  );
}

export function getAccessTokenPayload(): AccessTokenPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = getAccessToken();
  const payload = token?.split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function formatTokenDate(timestamp?: number): string {
  if (!timestamp) {
    return "Brak danych";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
}
