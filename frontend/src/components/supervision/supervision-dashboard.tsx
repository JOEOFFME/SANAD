"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Factory,
  Radio,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import { getDownstreamAssets, listAssets } from "@/lib/api/assets";
import { scanForAnomalies, simulateAllReadings } from "@/lib/api/sensors";
import { selectLatestReadings } from "@/lib/telemetry";
import { useLiveReadings } from "@/hooks/use-live-readings";
import { useLiveStore } from "@/stores/live-store";
import { AlarmRail } from "./alarm-rail";
import { EquipmentCard } from "./equipment-card";
import { NextUpdateSection } from "./next-update-section";
import { ProcessFlow, type TopologyLink } from "./process-flow";

export function SupervisionDashboard() {
  useLiveReadings();
  const queryClient = useQueryClient();
  const readings = useLiveStore((state) => state.readings);
  const connectionStatus = useLiveStore((state) => state.connectionStatus);
  const lastMessageAt = useLiveStore((state) => state.lastMessageAt);

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: listAssets,
  });

  const topologyQuery = useQuery({
    queryKey: ["topology", assetsQuery.data?.map((asset) => asset.id)],
    enabled: Boolean(assetsQuery.data?.length),
    queryFn: async (): Promise<TopologyLink[]> => {
      const assets = assetsQuery.data ?? [];
      const relations = await Promise.all(
        assets.map(async (asset) => ({
          source: asset.id,
          related: await getDownstreamAssets(asset.id, 1),
        })),
      );
      return relations.flatMap(({ source, related }) =>
        related.map((target) => ({
          source,
          target: target.asset_id,
          relation: target.relation,
        })),
      );
    },
  });

  const anomaliesQuery = useQuery({
    queryKey: ["anomalies"],
    queryFn: scanForAnomalies,
    refetchInterval: 10_000,
  });

  const simulation = useMutation({
    mutationFn: simulateAllReadings,
    onSuccess: () => {
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      }, 2_500);
    },
  });

  const latestReadings = useMemo(() => selectLatestReadings(readings), [readings]);
  const latestChannels = [...latestReadings.values()].reduce(
    (count, assetReadings) => count + Object.keys(assetReadings).length,
    0,
  );
  const findings = anomaliesQuery.data ?? [];
  const connected = connectionStatus === "connected";
  const lineState = !connected
    ? { label: "Connexion interrompue", tone: "danger" as const }
    : anomaliesQuery.isError
      ? { label: "Surveillance dégradée", tone: "danger" as const }
    : latestChannels === 0
      ? { label: "En attente de télémétrie", tone: "waiting" as const }
      : findings.length > 0
        ? { label: "Attention requise", tone: "warning" as const }
        : { label: "Production nominale", tone: "normal" as const };

  const toneStyles = {
    normal: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    waiting: "border-sky-200 bg-sky-50 text-sky-800",
  }[lineState.tone];

  return (
    <div className="mx-auto w-full max-w-[1800px]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-brand">
            <Radio className="size-3.5" aria-hidden="true" />
            Temps réel
          </div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-[28px]">
            Supervision en direct
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ligne de concassage · Jumeau opérationnel
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 xl:items-end">
          <button
            type="button"
            onClick={() => simulation.mutate()}
            disabled={simulation.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${simulation.isPending ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {simulation.isPending ? "Actualisation…" : "Actualiser les capteurs"}
          </button>
          <p className="min-h-4 text-xs text-slate-500" aria-live="polite">
            {simulation.isError
              ? "Actualisation impossible"
              : simulation.data
                ? `${simulation.data.count} mesures actualisées`
                : ""}
          </p>
        </div>
      </div>

      <section
        className="mb-4 grid border-y border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-[1.4fr_repeat(3,1fr)]"
        aria-label="État opérationnel"
      >
        <div className="flex min-h-20 items-center gap-3 border-b border-slate-200 px-4 sm:border-r xl:border-b-0">
          <span className={`flex size-10 items-center justify-center rounded-md border ${toneStyles}`}>
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-medium text-slate-500">État de la ligne</p>
            <p className="text-sm font-bold text-slate-950">{lineState.label}</p>
          </div>
        </div>

        <StatusMetric
          icon={Factory}
          label="Équipements"
          value={assetsQuery.data ? String(assetsQuery.data.length) : "--"}
        />
        <StatusMetric
          icon={Radio}
          label="Canaux actifs"
          value={String(latestChannels)}
        />
        <StatusMetric
          icon={AlertTriangle}
          label="Alarmes"
          value={String(findings.length)}
          warning={findings.length > 0}
        />
      </section>

      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-panel">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Synoptique du procédé</h2>
            <p className="text-xs text-slate-500">Flux matière et état des équipements</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-600">
            <Legend color="bg-blue-500" label="Nominal" />
            <Legend color="bg-amber-500" label="Risque" />
            <Legend color="bg-red-500" label="Alarme" />
            <span className="hidden items-center gap-1.5 text-slate-500 sm:flex">
              <Clock3 className="size-3.5" />
              {lastMessageAt
                ? new Intl.DateTimeFormat("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(new Date(lastMessageAt))
                : "--:--:--"}
            </span>
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0">
            {assetsQuery.isError || topologyQuery.isError ? (
              <div className="flex h-[560px] flex-col items-center justify-center bg-slate-100 px-6 text-center">
                <AlertTriangle className="mb-3 size-6 text-red-600" aria-hidden="true" />
                <p className="text-sm font-bold text-slate-900">Synoptique indisponible</p>
                <p className="mt-1 text-xs text-slate-500">
                  Les équipements ou leurs liaisons n’ont pas pu être chargés.
                </p>
              </div>
            ) : assetsQuery.data && topologyQuery.data ? (
              <ProcessFlow
                assets={assetsQuery.data}
                links={topologyQuery.data}
                readings={latestReadings}
                connected={connected}
              />
            ) : (
              <div className="flex h-[560px] items-center justify-center bg-slate-100 text-sm text-slate-500">
                Chargement du synoptique…
              </div>
            )}
          </div>
          <AlarmRail
            findings={findings}
            loading={anomaliesQuery.isPending}
            error={anomaliesQuery.isError}
          />
        </div>
      </section>

      <section
        id="equipment-cards"
        className="mt-7 scroll-mt-20"
        aria-labelledby="equipment-heading"
      >
        <div className="mb-3 flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h2 id="equipment-heading" className="text-base font-bold text-slate-950">
              État des équipements
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Mesures, tendances et exposition opérationnelle
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {assetsQuery.data?.length ?? 0} équipements
          </p>
        </div>

        {assetsQuery.isError ? (
          <div className="flex min-h-40 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-800">
            Les cartes équipements ne sont pas disponibles.
          </div>
        ) : assetsQuery.data ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {assetsQuery.data.map((asset) => (
              <EquipmentCard
                key={asset.id}
                asset={asset}
                readings={latestReadings.get(asset.id) ?? {}}
                connected={connected}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[286px] animate-pulse rounded-md bg-slate-200"
              />
            ))}
          </div>
        )}
      </section>

      <NextUpdateSection
        lastMessageAt={lastMessageAt}
        connectionStatus={connectionStatus}
        channelCount={latestChannels}
      />
    </div>
  );
}

interface StatusMetricProps {
  icon: typeof Factory;
  label: string;
  value: string;
  warning?: boolean;
}

function StatusMetric({ icon: Icon, label, value, warning = false }: StatusMetricProps) {
  return (
    <div className="flex min-h-20 items-center gap-3 border-b border-slate-200 px-4 last:border-b-0 sm:border-r sm:[&:nth-child(3)]:border-r-0 xl:border-b-0 xl:[&:nth-child(3)]:border-r xl:last:border-r-0">
      <Icon
        className={`size-5 ${warning ? "text-amber-600" : "text-slate-400"}`}
        aria-hidden="true"
      />
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className={`text-lg font-bold ${warning ? "text-amber-700" : "text-slate-950"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />
      {label}
    </span>
  );
}
