"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Toolbar } from "@/components/Toolbar";
import { ShareDialog, type ShareEntry } from "@/components/ShareDialog";
import type { Role } from "@/lib/permissions";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  role,
  owner,
  canManageSharing,
  canDelete,
  initialShares,
}: {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  role: Role;
  owner: { name: string; email: string };
  canManageSharing: boolean;
  canDelete: boolean;
  initialShares: ShareEntry[];
}) {
  const router = useRouter();
  const editable = role === "OWNER" || role === "EDIT";

  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "max-w-none focus:outline-none min-h-[60vh] px-10 py-8",
      },
    },
    onUpdate: () => {
      scheduleSave({ content: editor?.getHTML() });
    },
  });

  const save = useCallback(
    async (patch: { title?: string; content?: string }) => {
      setStatus("saving");
      setError(null);
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not save");
        setStatus("saved");
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not save");
      }
    },
    [documentId]
  );

  const scheduleSave = useCallback(
    (patch: { title?: string; content?: string }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(patch), 700);
    },
    [save]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave({ title: value || "Untitled document" });
  }

  async function handleDelete() {
    setStatus("saving");
    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not delete document");
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete document");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← All documents
        </Link>
        <div className="flex items-center gap-2 text-xs">
          {status === "saving" && <span className="text-neutral-400">Saving…</span>}
          {status === "saved" && <span className="text-neutral-400">Saved</span>}
          {status === "error" && <span className="text-red-600">{error ?? "Save failed"}</span>}
          {!editable && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-600">
              View only
            </span>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          disabled={!editable}
          placeholder="Untitled document"
          className="w-full max-w-lg bg-transparent text-2xl font-semibold text-neutral-900 outline-none disabled:text-neutral-700"
        />
        <div className="flex shrink-0 items-center gap-2">
          {role !== "OWNER" && (
            <span className="text-xs text-neutral-500">Owned by {owner.name}</span>
          )}
          {canManageSharing && (
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Share
            </button>
          )}
          {canDelete && !confirmingDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
          {canDelete && confirmingDelete && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-600">Delete this document?</span>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-2 py-1 font-medium text-white hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-md border border-neutral-300 px-2 py-1 text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {editable && editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>

      {shareOpen && (
        <ShareDialog
          documentId={documentId}
          initialShares={initialShares}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
