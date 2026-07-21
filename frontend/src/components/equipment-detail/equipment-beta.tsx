"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CircleAlert,
  Factory,
  Network,
  Radio,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAssetCascade,
  getDownstreamAssets,
  getUpstreamAssets,
  listAssets,
} from "@/lib/api/assets";
import { listIncidents } from "@/lib/api/incidents";
import { useLiveReadings } from "@/hooks/use-live-readings";
import { selectLatestReadings } from "@/lib/telemetry";
import { useLiveStore } from "@/stores/live-store";
import { AgentFeedback } from "./agent-feedback";
import { DocumentImport } from "./document-import";
import { SensorHistoryChart } from "./sensor-history-chart";

export function EquipmentBeta() {
  useLiveReadings();
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const readings = useLiveStore((state) => state.readings);
  const connectionStatus = useLiveStore((state) => state.connectionStatus);

  const assetsQuery = useQuery({ queryKey: ["assets"], queryFn: listAssets });
  const incidentsQuery = useQuery({ queryKey: ["incidents"], queryFn: listIncidents });

  useEffect(() => {
    if (selectedAssetId === null && assetsQuery.data?.[0]) {
      setSelectedAssetId(assetsQuery.data[0].id);
    }
  }, [assetsQuery.data, selectedAssetId]);

  const selectedAsset = assetsQuery.data?.find(
    (asset) => asset.id === selectedAssetId,
  );
  const selectedReadings = useMemo(
    () => readings.filter((reading) => reading.asset_id === selectedAssetId),
    [readings, selectedAssetId],
  );
  const latestReadings = useMemo(() => selectLatestReadings(readings), [readings]);

  const upstreamQuery = useQuery({
    queryKey: ["assets", selectedAssetId, "upstream"],
    queryFn: () => getUpstreamAssets(selectedAssetId as number, 2),
    enabled: selectedAssetId !== null,
  });
  const downstreamQuery = useQuery({
    queryKey: ["assets", selectedAssetId, "downstream"],
    queryFn: () => getDownstreamAssets(selectedAssetId as number, 2),
    enabled: selectedAssetId !== null,
  });
  const cascadeQuery = useQuery({
    queryKey: ["assets", selectedAssetId, "cascade"],
    queryFn: () => getAssetCascade(selectedAssetId as number),
    enabled: selectedAssetId !== null,
  });

  if (assetsQuery.isPending) {
    return (
      <div className="flex min-h-[520px] items-center justify-center text-sm text-slate-500">
        Chargement des équipements…
      </div>
    );
  }

  if (assetsQuery.isError || !selectedAsset) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
        <CircleAlert className="size-7 text-red-600" aria-hidden="true" />
        <p className="mt-3 text-sm font-bold text-slate-900">Équipements indisponibles</p>
      </div>
    );
  }

  const assetLatest = latestReadings.get(selectedAsset.id) ?? {};
  const latestValues = Object.values(assetLatest);
  const hasAlarm = latestValues.some((reading) => reading?.anomaly);
  const hasCascadeRisk = latestValues.some((reading) => reading?.cascade_risk);
  const connected = connectionStatus === "connected";
  const status = !connected
    ? { label: "Hors connexion", className: "bg-slate-100 text-slate-700" }
    : hasAlarm
      ? { label: "Alarme", className: "bg-red-50 text-red-800" }
      : hasCascadeRisk
        ? { label: "Risque cascade", className: "bg-amber-50 text-amber-800" }
        : { label: "Nominal", className: "bg-blue-50 text-blue-800" };
  const assetIncidents = (incidentsQuery.data ?? []).filter(
    (incident) => incident.asset_id === selectedAsset.id,
  );
  const openIncidents = assetIncidents.filter((incident) => !incident.resolved);
  const upstream = upstreamQuery.data ?? [];
  const downstream = downstreamQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-[1700px]">
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-brand">
          <Boxes className="size-3.5" aria-hidden="true" />
          Module bêta
        </div>
        <h1 className="text-2xl font-bold text-slate-950 sm:text-[28px]">
          Détail des équipements
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Capteurs, contexte procédé, documentation et assistance technique
        </p>
      </div>

      <div className="mb-4 lg:hidden">
        <label className="text-xs font-semibold text-slate-700">
          Équipement sélectionné
          <select
            value={selectedAsset.id}
            onChange={(event) => setSelectedAssetId(Number(event.target.value))}
            className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
          >
            {assetsQuery.data.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.code} · {asset.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="hidden self-start overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel lg:block">
          <div className="border-b border-slate-200 px-3 py-3">
            <p className="text-xs font-bold text-slate-900">Équipements</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {assetsQuery.data.length} actifs disponibles
            </p>
          </div>
          <div className="p-2">
            {assetsQuery.data.map((asset) => {
              const assetReadings = Object.values(latestReadings.get(asset.id) ?? {});
              const alarm = assetReadings.some((reading) => reading?.anomaly);
              const active = asset.id === selectedAsset.id;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`flex min-h-12 w-full items-center gap-2 rounded-md px-2.5 text-left ${
                    active ? "bg-blue-50 text-blue-950" : "text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-pressed={active}
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      alarm ? "bg-red-500" : connected ? "bg-blue-500" : "bg-slate-400"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold text-slate-500">
                      {asset.code}
                    </span>
                    <span className="block truncate text-xs font-semibold">{asset.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0">
          <section className="mb-4 flex flex-col gap-4 border-y border-slate-300 bg-white px-4 py-4 sm:flex-row sm:items-center">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Factory className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-slate-500">{selectedAsset.code}</p>
                <span className={`rounded px-2 py-1 text-[10px] font-bold ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <h2 className="mt-1 truncate text-xl font-bold text-slate-950">
                {selectedAsset.name}
              </h2>
              <p className="mt-0.5 text-xs capitalize text-slate-500">
                {selectedAsset.asset_type}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:text-right">
              <span className="text-slate-500">Mesures</span>
              <span className="font-bold text-slate-900">{selectedReadings.length}</span>
              <span className="text-slate-500">Incidents ouverts</span>
              <span className="font-bold text-slate-900">{openIncidents.length}</span>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
            <SensorHistoryChart readings={selectedReadings} />

            <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Network className="size-4 text-brand" aria-hidden="true" />
                  <h2 className="text-sm font-bold text-slate-950">Contexte procédé</h2>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">Relations réelles de l’actif</p>
              </div>
              <div className="divide-y divide-slate-100 px-4">
                <RelationList
                  icon={ArrowUpFromLine}
                  label="Amont"
                  assets={upstream.map((asset) => `${asset.code} · ${asset.name}`)}
                />
                <RelationList
                  icon={ArrowDownToLine}
                  label="Aval"
                  assets={downstream.map((asset) => `${asset.code} · ${asset.name}`)}
                />
                <div className="flex min-h-16 items-center justify-between gap-3 py-3 text-xs">
                  <span className="text-slate-500">Portée cascade</span>
                  <span className="font-bold text-slate-900">
                    {cascadeQuery.data
                      ? `${cascadeQuery.data.total_hops_affected} niveaux`
                      : "--"}
                  </span>
                </div>
                <div className="flex min-h-16 items-center justify-between gap-3 py-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CircleAlert className="size-3.5" aria-hidden="true" />
                    Historique incidents
                  </span>
                  <span className="font-bold text-slate-900">{assetIncidents.length}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <DocumentImport key={`documents-${selectedAsset.id}`} asset={selectedAsset} />
            <AgentFeedback
              key={`feedback-${selectedAsset.id}`}
              assetId={selectedAsset.id}
              assetName={selectedAsset.name}
              sensorSamples={selectedReadings.length}
              incidentCount={assetIncidents.length}
              upstreamCount={upstream.length}
              downstreamCount={downstream.length}
              hasDocumentation={Boolean(selectedAsset.manual_ref)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

interface RelationListProps {
  icon: typeof Radio;
  label: string;
  assets: string[];
}

function RelationList({ icon: Icon, label, assets }: RelationListProps) {
  const uniqueAssets = [...new Set(assets)];

  return (
    <div className="py-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </p>
      {uniqueAssets.length > 0 ? (
        <div className="mt-2 space-y-1">
          {uniqueAssets.map((asset) => (
            <p key={asset} className="truncate text-xs font-bold text-slate-800">
              {asset}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400">Aucune relation</p>
      )}
    </div>
  );
}
