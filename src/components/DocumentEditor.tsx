"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { StyledBulletList, StyledOrderedList } from "@/lib/tiptap-list-style";
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
      StarterKit.configure({ bulletList: false, orderedList: false }),
      StyledBulletList,
      StyledOrderedList,
      Underline,
      TextStyle,
      FontSize,
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

  // Tiptap v3's useEditor doesn't re-render on every transaction by default
  // (a perf change) — without this, toolbar highlighting (bold/italic/...)
  // and the font-size field would lag a render behind the actual selection.
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        heading1: e.isActive("heading", { level: 1 }),
        heading2: e.isActive("heading", { level: 2 }),
        paragraph: e.isActive("paragraph"),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        bulletStyle: (e.getAttributes("bulletList").bulletStyle as string | undefined) ?? "disc",
        numberStyle: (e.getAttributes("orderedList").numberStyle as string | undefined) ?? "decimal",
        fontSize: (e.getAttributes("textStyle").fontSize as string | undefined) ?? null,
      };
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
        <Link
          href="/"
          className="flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          ← All documents
        </Link>
        <div className="flex items-center gap-2 text-xs">
          {status === "saving" && (
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              Saving…
            </span>
          )}
          {status === "saved" && (
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Saved
            </span>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {error ?? "Save failed"}
            </span>
          )}
          {!editable && (
            <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700 ring-1 ring-sky-100">
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
          className="w-full max-w-lg rounded-md bg-transparent px-1 text-2xl font-semibold text-slate-900 outline-none transition focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-indigo-200 disabled:text-slate-700"
        />
        <div className="flex shrink-0 items-center gap-2">
          {role !== "OWNER" && (
            <span className="text-xs text-slate-500">Owned by {owner.name}</span>
          )}
          {canManageSharing && (
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
            >
              Share
            </button>
          )}
          {canDelete && !confirmingDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
            >
              Delete
            </button>
          )}
          {canDelete && confirmingDelete && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600">Delete this document?</span>
              <button
                onClick={handleDelete}
                className="rounded-full bg-rose-600 px-2.5 py-1 font-medium text-white transition hover:bg-rose-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        {editable && editor && editorState && (
          <Toolbar editor={editor} state={editorState} />
        )}
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
