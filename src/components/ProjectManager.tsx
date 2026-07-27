"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { Project } from "@/lib/types";

export default function ProjectManager({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]";

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to create project");
        return;
      }
      setName("");
      setDescription("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: number) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: number, projectName: string, count: number) {
    if (
      !confirm(
        count
          ? `Delete project "${projectName}"? ${count} account${count > 1 ? "s" : ""} will be unassigned (accounts themselves are kept).`
          : `Delete project "${projectName}"?`
      )
    )
      return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="card px-5 py-5">
      <h2 className="text-base font-semibold">Projects</h2>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">
        Group accounts by client or purpose. An account can belong to several
        projects.
      </p>

      <form onSubmit={create} className="mt-4 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          aria-label="Project name"
          className={`${inputCls} min-w-40 flex-1`}
          autoComplete="off"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          aria-label="Project description"
          className={`${inputCls} min-w-40 flex-1`}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {busy ? "Adding…" : "Add project"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-sm" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      ) : null}

      {projects.length ? (
        <ul className="mt-4 divide-y divide-[var(--gridline)]">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2.5">
              {editingId === p.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={inputCls}
                    aria-label="Edit project name"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit(p.id)}
                    aria-label="Save"
                    className="rounded-lg border border-[var(--border)] p-2"
                    style={{ color: "var(--good)" }}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    aria-label="Cancel"
                    className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-muted)]"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                      {p.account_count ?? 0} account
                      {(p.account_count ?? 0) === 1 ? "" : "s"}
                      {p.description ? ` · ${p.description}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                    aria-label={`Rename ${p.name}`}
                    className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(p.id, p.name, p.account_count ?? 0)}
                    aria-label={`Delete ${p.name}`}
                    className="rounded-lg border border-[var(--border)] p-2 hover:border-[var(--critical)]"
                    style={{ color: "var(--critical)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-muted)]">No projects yet.</p>
      )}
    </section>
  );
}
