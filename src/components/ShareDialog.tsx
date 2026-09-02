"use client";

import { useState } from "react";
import { getAvatarColor } from "@/lib/avatarColor";

export type ShareEntry = {
  userId: string;
  name: string;
  email: string;
  permission: "VIEW" | "EDIT";
};

export function ShareDialog({
  documentId,
  initialShares,
  onClose,
}: {
  documentId: string;
  initialShares: ShareEntry[];
  onClose: () => void;
}) {
  const [shares, setShares] = useState(initialShares);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"VIEW" | "EDIT">("EDIT");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, permission }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not share document");
      setShares(data.shares);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  async function removeShare(userId: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not remove access");
      setShares(data.shares);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-indigo-100 bg-white p-5 shadow-2xl shadow-indigo-200/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Share document</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={addShare} className="mb-4 flex gap-2">
          <input
            type="email"
            required
            placeholder="person@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}
            className="rounded-lg border border-slate-200 px-2 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="EDIT">Can edit</option>
            <option value="VIEW">Can view</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            Share
          </button>
        </form>

        {error && (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {shares.length === 0 && (
            <p className="text-xs text-slate-500">Not shared with anyone yet.</p>
          )}
          {shares.map((s) => {
            const color = getAvatarColor(s.email);
            return (
              <div
                key={s.userId}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
                  >
                    {s.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      s.permission === "EDIT"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    {s.permission === "EDIT" ? "Can edit" : "Can view"}
                  </span>
                  <button
                    onClick={() => removeShare(s.userId)}
                    disabled={pending}
                    className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
