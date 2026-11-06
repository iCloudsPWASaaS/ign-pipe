"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, X } from "lucide-react";
import { navGroups } from "@/lib/nav";
import type { SessionUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { PropertyQuickSearch } from "@/components/property-quick-search";

export function AppShell({
  session,
  appName,
  appSubtitle,
  children,
}: {
  session: SessionUser;
  appName: string;
  appSubtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const groups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.hidden && (!item.roles || item.roles.includes(session.role)),
      ),
    }))
    .filter((group) => group.items.length > 0);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
          {initials(appName)}
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-pipe-ink">{appName}</div>
            <div className="truncate text-[10px] uppercase tracking-[0.18em] text-slate-400">
              {appSubtitle}
            </div>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {groups.map((group, index) => (
          <div key={group.label || `group-${index}`}>
            {group.label && !collapsed ? <div className="section-title px-2">{group.label}</div> : null}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={[
                      "nav-link",
                      isActive(item.href) ? "nav-link-active" : "",
                      item.accent && !isActive(item.href) ? "nav-link-accent" : "",
                      collapsed ? "justify-center px-2" : "",
                    ].join(" ")}
                  >
                    {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="nav-link hidden w-full md:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Collapse menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all md:block",
          collapsed ? "w-[76px]" : "w-[268px]",
        ].join(" ")}
      >
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-pipe-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl">
            <div className="absolute right-3 top-3">
              <button className="btn btn-secondary btn-sm" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className={collapsed ? "md:pl-[76px]" : "md:pl-[268px]"}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            className="btn btn-secondary btn-sm md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-pipe-ink">
              {session.role === 1 ? "Administrator" : session.role === 2 ? "Staff" : "Contractor"} workspace
            </div>
            <div className="text-[11px] text-slate-400">
              Signed in as {session.name} ({session.user})
            </div>
          </div>

          <PropertyQuickSearch />

          <Link href="/issues/new" className="btn btn-primary btn-sm hidden sm:inline-flex">
            <Plus className="h-4 w-4" />
            Create Issue
          </Link>

          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-800">
              {initials(session.name || session.user)}
            </div>
            <a href="/api/auth/logout" className="btn btn-secondary btn-sm" title="Logout">
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Logout</span>
            </a>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
