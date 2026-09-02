"use client";

import { useState } from "react";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Share document</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
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
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}
            className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
          >
            <option value="EDIT">Can edit</option>
            <option value="VIEW">Can view</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Share
          </button>
        </form>

        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

        <div className="flex flex-col gap-2">
          {shares.length === 0 && (
            <p className="text-xs text-neutral-500">Not shared with anyone yet.</p>
          )}
          {shares.map((s) => (
            <div
              key={s.userId}
              className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2"
            >
              <div>
                <p className="text-sm text-neutral-900">{s.name}</p>
                <p className="text-xs text-neutral-500">{s.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                  {s.permission === "EDIT" ? "Can edit" : "Can view"}
                </span>
                <button
                  onClick={() => removeShare(s.userId)}
                  disabled={pending}
                  className="text-xs text-red-600 hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
