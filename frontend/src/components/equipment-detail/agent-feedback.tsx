"use client";

import { useMutation } from "@tanstack/react-query";
import { Bot, CheckCircle2, Link2, Send } from "lucide-react";
import { useState } from "react";
import {
  knowledgeCapabilities,
  requestAgentFeedback,
} from "@/lib/api/knowledge";

interface AgentFeedbackProps {
  assetId: number;
  assetName: string;
  sensorSamples: number;
  incidentCount: number;
  upstreamCount: number;
  downstreamCount: number;
  hasDocumentation: boolean;
}

export function AgentFeedback({
  assetId,
  assetName,
  sensorSamples,
  incidentCount,
  upstreamCount,
  downstreamCount,
  hasDocumentation,
}: AgentFeedbackProps) {
  const [query, setQuery] = useState("");
  const feedback = useMutation({ mutationFn: requestAgentFeedback });

  const contexts = [
    `${sensorSamples} mesures capteur`,
    `${incidentCount} incidents`,
    `${upstreamCount} amont · ${downstreamCount} aval`,
    hasDocumentation ? "Documentation liée" : "Documentation non liée",
  ];

  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-brand" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-950">Feedback de l’agent</h2>
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700">
            Bêta
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">Analyse contextualisée de {assetName}</p>
      </div>

      <div className="p-4">
        {!knowledgeCapabilities.agentFeedback ? (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            <Link2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            L’agent existe dans le dépôt mais aucune route API ne l’expose encore.
          </div>
        ) : null}

        <p className="text-[11px] font-bold uppercase text-slate-500">Contexte disponible</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {contexts.map((context) => (
            <span
              key={context}
              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700"
            >
              <CheckCircle2 className="size-3 text-blue-600" aria-hidden="true" />
              {context}
            </span>
          ))}
        </div>

        <label className="mt-4 block text-xs font-semibold text-slate-700">
          Symptôme ou question opérateur
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={4}
            placeholder="Décrire le comportement observé sur l’équipement…"
            className="mt-1 w-full resize-none rounded-md border border-slate-300 bg-white p-3 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>

        <button
          type="button"
          disabled={
            !query.trim() ||
            !knowledgeCapabilities.agentFeedback ||
            feedback.isPending
          }
          onClick={() => feedback.mutate({ assetId, query: query.trim() })}
          className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-3 text-xs font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Send className="size-3.5" aria-hidden="true" />
          {feedback.isPending ? "Analyse en cours…" : "Analyser avec l’agent"}
        </button>

        {feedback.isError ? (
          <p className="mt-2 text-xs font-semibold text-red-700">
            L’agent n’a pas pu produire de réponse.
          </p>
        ) : null}

        {feedback.data ? (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-[11px] font-bold uppercase text-slate-500">Réponse</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
              {feedback.data.answer}
            </p>
            {feedback.data.sources.length > 0 ? (
              <div className="mt-3 space-y-1">
                {feedback.data.sources.map((source, index) => (
                  <p key={`${source.label}-${index}`} className="text-xs text-slate-500">
                    Source : {source.label}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
