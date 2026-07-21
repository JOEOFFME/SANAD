"use client";

import { LayoutDashboard, Menu, PanelLeftClose, X } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SystemHealth } from "./system-health";

interface AppShellProps {
  children: ReactNode;
}

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
] as const;

export function AppShell({ children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {menuOpen ? (
        <button
          className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-panel transition-transform duration-200 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">
              S
            </span>
            <span>
              <span className="block text-base font-bold leading-5">SANAD</span>
              <span className="block text-xs text-muted">Operations</span>
            </span>
          </Link>
          <button
            className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
            title="Close navigation"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5" aria-label="Primary navigation">
          <p className="px-3 pb-2 text-xs font-semibold uppercase text-muted">
            Workspace
          </p>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-10 items-center gap-3 rounded-md bg-emerald-50 px-3 text-sm font-semibold text-brand-dark"
                onClick={() => setMenuOpen(false)}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-4">
          <SystemHealth />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-line bg-panel/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            className="mr-3 flex size-9 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            title="Open navigation"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <PanelLeftClose
              className="hidden size-4 text-muted lg:block"
              aria-hidden="true"
            />
            <p className="truncate text-sm font-semibold">Crushing operations</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
            SANAD system
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
