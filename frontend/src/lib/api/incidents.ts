import { apiRequest } from "./client";
import type { IncidentIn, IncidentOut } from "./types";

export const listIncidents = (): Promise<IncidentOut[]> =>
  apiRequest<IncidentOut[]>("/incidents/");

export const createIncident = (payload: IncidentIn): Promise<IncidentOut> =>
  apiRequest<IncidentOut>("/incidents/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
