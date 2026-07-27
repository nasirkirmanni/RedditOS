"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutButton({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      disabled={busy}
      title={collapsed ? "Sign out" : undefined}
      className="mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:opacity-50"
    >
      <LogOut size={18} className="shrink-0" />
      {!collapsed ? <span>{busy ? "Signing out…" : "Sign out"}</span> : null}
    </button>
  );
}
