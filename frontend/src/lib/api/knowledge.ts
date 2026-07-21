import { API_BASE_URL } from "@/lib/config";
import { ApiError } from "./client";
import type { IsoDateString } from "./types";

const documentUploadPath = process.env.NEXT_PUBLIC_DOCUMENT_UPLOAD_PATH;
const agentFeedbackPath = process.env.NEXT_PUBLIC_AGENT_FEEDBACK_PATH;

export const knowledgeCapabilities = {
  documentUpload: Boolean(documentUploadPath),
  agentFeedback: Boolean(agentFeedbackPath),
} as const;

export interface AssetDocument {
  id: number | string;
  asset_id: number;
  filename: string;
  media_type: string;
  status: "uploaded" | "indexing" | "ready" | "failed";
  created_at: IsoDateString;
}

export interface AgentSource {
  label: string;
  document_id?: number | string;
  excerpt?: string;
}

export interface AgentFeedbackResponse {
  answer: string;
  confidence?: number;
  sources: AgentSource[];
}

interface UploadAssetDocumentInput {
  assetId: number;
  file: File;
  title?: string;
}

interface RequestAgentFeedbackInput {
  assetId: number;
  query: string;
}

export async function uploadAssetDocument({
  assetId,
  file,
  title,
}: UploadAssetDocumentInput): Promise<AssetDocument> {
  if (!documentUploadPath) {
    throw new Error("Document upload API is not configured");
  }

  const path = documentUploadPath.replace("{asset_id}", String(assetId));
  const formData = new FormData();
  formData.set("file", file);
  formData.set("asset_id", String(assetId));
  if (title) formData.set("title", title);

  return requestKnowledgeApi<AssetDocument>(path, {
    method: "POST",
    body: formData,
  });
}

export async function requestAgentFeedback({
  assetId,
  query,
}: RequestAgentFeedbackInput): Promise<AgentFeedbackResponse> {
  if (!agentFeedbackPath) {
    throw new Error("Agent feedback API is not configured");
  }

  return requestKnowledgeApi<AgentFeedbackResponse>(agentFeedbackPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asset_id: assetId, query }),
  });
}

async function requestKnowledgeApi<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    let detail: unknown;
    try {
      detail = (await response.json()) as unknown;
    } catch {
      detail = undefined;
    }
    throw new ApiError(
      `Knowledge API request failed with status ${response.status}`,
      response.status,
      detail,
    );
  }
  return (await response.json()) as T;
}
