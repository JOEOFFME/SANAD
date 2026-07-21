import { Activity, Radio, ShieldCheck } from "lucide-react";
import { SystemHealth } from "@/components/layout/system-health";
import { API_BASE_URL, WS_BASE_URL } from "@/lib/config";

export default function OverviewPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-7 border-b border-line pb-5">
        <p className="mb-1 text-sm font-semibold text-brand">Operations</p>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">System overview</h1>
      </div>

      <section aria-labelledby="connection-heading">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="size-4 text-muted" aria-hidden="true" />
          <h2 id="connection-heading" className="text-sm font-semibold text-ink">
            Connection status
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-md border border-line bg-panel p-5 shadow-panel">
            <SystemHealth />
            <p className="mt-5 truncate border-t border-line pt-3 font-mono text-xs text-muted">
              {API_BASE_URL}
            </p>
          </article>

          <article className="rounded-md border border-line bg-panel p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700">
                <Radio className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium text-muted">Live telemetry</p>
                <p className="text-sm font-semibold text-ink">Configured</p>
              </div>
            </div>
            <p className="mt-5 truncate border-t border-line pt-3 font-mono text-xs text-muted">
              {WS_BASE_URL}/ws/live
            </p>
          </article>

          <article className="rounded-md border border-line bg-panel p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-warning">
                <ShieldCheck className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium text-muted">Access policy</p>
                <p className="text-sm font-semibold text-ink">Open API</p>
              </div>
            </div>
            <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
              No credentials required
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
