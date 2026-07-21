import { apiRequest } from "./client";
import type { AssetOut, CascadeResponse, RelatedAsset } from "./types";

export const listAssets = (): Promise<AssetOut[]> =>
  apiRequest<AssetOut[]>("/assets/");

export const getDownstreamAssets = (
  assetId: number,
  hops = 1,
): Promise<RelatedAsset[]> =>
  apiRequest<RelatedAsset[]>(`/assets/${assetId}/downstream?hops=${hops}`);

export const getUpstreamAssets = (
  assetId: number,
  hops = 1,
): Promise<RelatedAsset[]> =>
  apiRequest<RelatedAsset[]>(`/assets/${assetId}/upstream?hops=${hops}`);

export const getAssetCascade = (assetId: number): Promise<CascadeResponse> =>
  apiRequest<CascadeResponse>(`/assets/${assetId}/cascade`);
