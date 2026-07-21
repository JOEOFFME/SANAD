import { apiRequest } from "./client";
import type { HealthResponse } from "./types";

export const getHealth = (): Promise<HealthResponse> =>
  apiRequest<HealthResponse>("/health", { cache: "no-store" });
