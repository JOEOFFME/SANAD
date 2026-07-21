"use client";

import {
  Activity,
  Boxes,
  CalendarClock,
  Menu,
  RadioTower,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SystemHealth } from "./system-health";

interface AppShellProps {
  children: ReactNode;
}

const navigation: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}> = [
  { label: "Supervision", href: "/", icon: RadioTower },
  { label: "Équipements", href: "/equipements", icon: Boxes, badge: "Bêta" },
  { label: "Coming updates", href: "/coming-updates", icon: CalendarClock },
];

export function AppShell({ children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f2f4f5] text-ink">
      {menuOpen ? (
        <button
          className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-700 bg-[#17212b] text-white transition-transform duration-200 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-blue-500 text-sm font-black text-white">
              SN
            </span>
            <span>
              <span className="block text-base font-bold leading-5">SANAD</span>
              <span className="block text-xs text-slate-400">Industrie 4.0</span>
            </span>
          </Link>
          <button
            className="flex size-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
            title="Close navigation"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5" aria-label="Primary navigation">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase text-slate-500">
            Espace de travail
          </p>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-blue-500/15 text-blue-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-300">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 bg-[#121b24] p-4 [&_p]:text-slate-300 [&_p:first-of-type]:text-slate-500 [&_span]:border-slate-600 [&_span]:bg-slate-800 [&_span]:text-slate-300">
          <SystemHealth />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            className="mr-3 flex size-9 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            title="Open navigation"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Activity className="hidden size-4 text-brand lg:block" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Ligne de concassage</p>
              <p className="hidden truncate text-[11px] text-slate-500 sm:block">Centre de conduite · SANAD</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="size-2 rounded-full bg-blue-500" aria-hidden="true" />
            Poste opérateur
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 lg:px-7 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
