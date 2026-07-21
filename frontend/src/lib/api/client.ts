import { API_BASE_URL } from "@/lib/config";

interface FastApiValidationError {
  detail?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let body: FastApiValidationError | undefined;
    try {
      body = (await response.json()) as FastApiValidationError;
    } catch {
      body = undefined;
    }

    throw new ApiError(
      `API request failed with status ${response.status}`,
      response.status,
      body?.detail,
    );
  }

  return (await response.json()) as T;
}
