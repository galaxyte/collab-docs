"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewDocumentButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDocument() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled document" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create document");
      router.push(`/doc/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        onClick={createDocument}
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Creating…" : "+ New document"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
