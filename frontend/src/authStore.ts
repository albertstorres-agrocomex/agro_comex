// Client-side only — access token must never be stored on the server
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return _accessToken;
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  _accessToken = token;
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  _accessToken = null;
}
