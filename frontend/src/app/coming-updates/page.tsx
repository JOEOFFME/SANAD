import {
  BellRing,
  Boxes,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  Network,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface RoadmapItem {
  title: string;
  description: string;
  status: "Prochaine étape" | "Planifiée" | "Prévue";
  icon: LucideIcon;
}

const roadmap: RoadmapItem[] = [
  {
    title: "Détail des équipements",
    description:
      "Historique capteur, diagnostic, documentation et relations amont-aval pour chaque actif.",
    status: "Prochaine étape",
    icon: Boxes,
  },
  {
    title: "Centre d’alarmes",
    description:
      "Qualification, acquittement, priorité et suivi complet des anomalies de la ligne.",
    status: "Planifiée",
    icon: BellRing,
  },
  {
    title: "Maintenance et incidents",
    description:
      "Création, diagnostic, actions correctives, résolution et retour des opérateurs.",
    status: "Planifiée",
    icon: Wrench,
  },
  {
    title: "Jumeau numérique avancé",
    description:
      "Simulation de défaillance, propagation en cascade et analyse interactive des impacts.",
    status: "Planifiée",
    icon: Network,
  },
  {
    title: "Pilotage de l’usine",
    description:
      "Disponibilité, performance, fréquence des incidents et tendances du risque de production.",
    status: "Prévue",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Accès par rôle",
    description:
      "Espaces dédiés aux opérateurs, techniciens de maintenance et responsables de production.",
    status: "Prévue",
    icon: ShieldCheck,
  },
];

const statusStyles: Record<RoadmapItem["status"], string> = {
  "Prochaine étape": "bg-blue-50 text-blue-800",
  Planifiée: "bg-amber-50 text-amber-800",
  Prévue: "bg-slate-100 text-slate-700",
};

export default function ComingUpdatesPage() {
  const nextItem = roadmap[0];
  if (!nextItem) return null;

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-brand">
          <CalendarClock className="size-3.5" aria-hidden="true" />
          Feuille de route
        </div>
        <h1 className="text-2xl font-bold text-slate-950 sm:text-[28px]">
          Coming updates
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          Les prochaines capacités prévues pour enrichir la supervision et les opérations de maintenance.
        </p>
      </div>

      <section
        className="grid overflow-hidden border-y border-slate-300 bg-white lg:grid-cols-[260px_minmax(0,1fr)]"
        aria-labelledby="next-feature-heading"
      >
        <div className="flex min-h-40 flex-col justify-center border-b border-slate-200 bg-blue-50 px-5 py-5 lg:border-b-0 lg:border-r">
          <ClipboardCheck className="mb-3 size-6 text-brand" aria-hidden="true" />
          <p className="text-xs font-bold uppercase text-blue-700">Prochaine fonction</p>
          <h2 id="next-feature-heading" className="mt-1 text-lg font-bold text-slate-950">
            {nextItem.title}
          </h2>
        </div>
        <div className="flex min-h-40 items-center px-5 py-6 lg:px-7">
          <div>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {nextItem.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded bg-slate-100 px-2 py-1">Courbes historiques</span>
              <span className="rounded bg-slate-100 px-2 py-1">État détaillé</span>
              <span className="rounded bg-slate-100 px-2 py-1">Impact procédé</span>
            </div>
            <Link
              href="/equipements"
              className="mt-5 inline-flex h-9 items-center rounded-md bg-brand px-3 text-xs font-bold text-white hover:bg-brand-dark"
            >
              Ouvrir la bêta
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="roadmap-heading">
        <div className="mb-3 border-b border-slate-200 pb-3">
          <h2 id="roadmap-heading" className="text-base font-bold text-slate-950">
            Fonctions à venir
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Ordre indicatif, sans engagement de date.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roadmap.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="flex min-h-[220px] flex-col rounded-md border border-slate-200 bg-white p-5 shadow-panel"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-[10px] font-bold ${statusStyles[item.status]}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-5 text-[11px] font-bold text-slate-400">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 text-sm font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
