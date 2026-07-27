"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const input =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus:border-[var(--accent)]";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not sign in.");
        setPassword("");
        return;
      }
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 px-5 py-5">
      <div>
        <h1 className="text-base font-semibold">Sign in</h1>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          This dashboard is private.
        </p>
      </div>

      <div>
        <label htmlFor="username" className="mb-1 block text-xs font-medium">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={input}
          autoComplete="username"
          autoFocus
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium">
          Password
        </label>
        <div className="flex gap-2">
          <input
            id="password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="shrink-0 rounded-lg border border-[var(--border)] px-3 text-xs text-[var(--text-secondary)]"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !username.trim() || !password}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "var(--accent)" }}
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
