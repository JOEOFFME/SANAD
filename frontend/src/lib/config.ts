const stripTrailingSlash = (value: string): string => value.replace(/\/$/, "");

export const API_BASE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
);

export const WS_BASE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_WS_URL ?? API_BASE_URL.replace(/^http/, "ws"),
);
