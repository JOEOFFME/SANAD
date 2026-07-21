"use client";

import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import type { AnomalyScanFinding } from "@/lib/api/types";

interface AlarmRailProps {
  findings: AnomalyScanFinding[];
  loading: boolean;
  error: boolean;
}

const severityLabels = {
  low: "Faible",
  medium: "Moyenne",
  high: "Critique",
} as const;

export function AlarmRail({ findings, loading, error }: AlarmRailProps) {
  return (
    <aside className="flex min-h-[320px] flex-col border-l border-slate-200 bg-white xl:min-h-[560px]">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-900">Alarmes actives</h2>
        </div>
        <span className="flex min-w-6 items-center justify-center rounded bg-slate-100 px-1.5 py-1 text-xs font-bold text-slate-700">
          {findings.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-2" aria-label="Chargement des alarmes">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-md bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center px-5 text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-md bg-red-50 text-red-700">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold text-slate-900">Alarmes indisponibles</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              La dernière analyse n’a pas pu être récupérée.
            </p>
          </div>
        ) : findings.length === 0 ? (
          <div className="flex h-full min-h-64 flex-col items-center justify-center px-5 text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold text-slate-900">Aucune alarme active</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Tous les capteurs sont dans leurs plages normales.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {findings.map((finding) => (
              <article
                key={`${finding.asset_id}-${finding.sensor_type}`}
                className="rounded-md border border-red-200 bg-red-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-red-900">
                      {finding.asset_code} · {finding.asset_name}
                    </p>
                    <p className="mt-1 text-xs capitalize text-red-700">
                      {finding.sensor_type} · {finding.value}
                    </p>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-red-500" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-red-200 pt-2 text-[11px]">
                  <span className="font-semibold text-red-800">
                    {severityLabels[finding.severity]}
                  </span>
                  <span className="text-red-600">
                    Écart +{Math.round(finding.deviation_ratio * 100)}%
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
