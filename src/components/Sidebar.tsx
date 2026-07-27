"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Hash,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Users },
  { href: "/subreddits", label: "Subreddits", icon: Hash },
  { href: "/activity", label: "Activity log", icon: ListTodo },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
  }

  return (
    <aside
      className="sticky top-0 flex h-dvh shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)]"
      style={{
        width: collapsed ? 64 : 216,
        transition: mounted ? "width 200ms ease-out" : undefined,
      }}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
          style={{ background: "var(--series-2)" }}
        >
          R
        </span>
        {!collapsed ? (
          <span className="truncate text-base font-bold tracking-tight">
            Reddit<span style={{ color: "var(--series-2)" }}>OS</span>
          </span>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-2" aria-label="Main navigation">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                active
                  ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              }`}
              style={active ? { boxShadow: "inset 2px 0 0 var(--accent)" } : undefined}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed ? <span className="truncate">{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="mx-2 mb-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
      >
        {collapsed ? (
          <PanelLeftOpen size={18} className="shrink-0" />
        ) : (
          <>
            <PanelLeftClose size={18} className="shrink-0" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
