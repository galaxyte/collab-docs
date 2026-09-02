"use client";

import type { Editor } from "@tiptap/react";

export type ToolbarState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  heading1: boolean;
  heading2: boolean;
  paragraph: boolean;
  bulletList: boolean;
  orderedList: boolean;
  bulletStyle: string;
  numberStyle: string;
  fontSize: string | null;
};

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition ${
        active
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
          : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
      }`}
    >
      {children}
    </button>
  );
}

const FONT_SIZE_PRESETS = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];
const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 200;

function FontSizeControl({
  editor,
  fontSize,
}: {
  editor: Editor;
  fontSize: string | null;
}) {
  const currentPx = fontSize ? parseInt(fontSize, 10) : null;

  function applySize(raw: string) {
    if (raw.trim() === "") {
      editor.chain().focus().unsetFontSize().run();
      return;
    }
    const px = Number(raw);
    if (Number.isNaN(px)) return;
    const clamped = Math.min(Math.max(Math.round(px), MIN_FONT_SIZE), MAX_FONT_SIZE);
    editor.chain().focus().setFontSize(`${clamped}px`).run();
  }

  // Uncontrolled + keyed on the current size: free typing isn't fought by
  // React, but moving the cursor to text of a different size (a new
  // `fontSize` prop from useEditorState) remounts the field to match it.
  const resetKey = currentPx ?? "none";

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        key={resetKey}
        list="font-size-presets"
        min={MIN_FONT_SIZE}
        max={MAX_FONT_SIZE}
        defaultValue={currentPx ?? ""}
        placeholder="16"
        onBlur={(e) => applySize(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        aria-label="Font size in pixels"
        title="Font size (px) — type a value or pick from the dropdown"
        className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <datalist id="font-size-presets">
        {FONT_SIZE_PRESETS.map((size) => (
          <option key={size} value={size} />
        ))}
      </datalist>
    </div>
  );
}

const BLOCK_TYPES = [
  { value: "p", label: "Normal text" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
] as const;

function BlockTypeControl({ editor, state }: { editor: Editor; state: ToolbarState }) {
  const value = state.heading1 ? "h1" : state.heading2 ? "h2" : "p";

  function applyBlockType(next: string) {
    if (next === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (next === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
    else editor.chain().focus().setParagraph().run();
  }

  return (
    <select
      value={value}
      onChange={(e) => applyBlockType(e.target.value)}
      aria-label="Text style"
      title="Text style"
      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
    >
      {BLOCK_TYPES.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}

const BULLET_STYLES = [
  { value: "disc", label: "• Filled" },
  { value: "circle", label: "○ Outline" },
  { value: "square", label: "■ Square" },
] as const;

const NUMBER_STYLES = [
  { value: "decimal", label: "1, 2, 3…" },
  { value: "lower-alpha", label: "a, b, c…" },
  { value: "upper-alpha", label: "A, B, C…" },
  { value: "lower-roman", label: "i, ii, iii…" },
  { value: "upper-roman", label: "I, II, III…" },
] as const;

function ListStyleSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      title={label}
      className="h-8 rounded-md border border-slate-200 bg-white px-1 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Toolbar({ editor, state }: { editor: Editor; state: ToolbarState }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/60 px-4 py-2">
      <FontSizeControl editor={editor} fontSize={state.fontSize} />

      <div className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        label="Bold"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      <BlockTypeControl editor={editor} state={state} />

      <div className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        label="Bulleted list"
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •—
      </ToolbarButton>
      <ListStyleSelect
        label="Bullet style"
        value={state.bulletStyle}
        options={BULLET_STYLES}
        onChange={(bulletStyle) => {
          const chain = editor.chain().focus();
          (state.bulletList ? chain : chain.toggleBulletList())
            .updateAttributes("bulletList", { bulletStyle })
            .run();
        }}
      />

      <div className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        label="Numbered list"
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ListStyleSelect
        label="Number style"
        value={state.numberStyle}
        options={NUMBER_STYLES}
        onChange={(numberStyle) => {
          const chain = editor.chain().focus();
          (state.orderedList ? chain : chain.toggleOrderedList())
            .updateAttributes("orderedList", { numberStyle })
            .run();
        }}
      />

      <div className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↺
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↻
      </ToolbarButton>
    </div>
  );
}
