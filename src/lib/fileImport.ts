import { marked } from "marked";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Wraps plain text into Tiptap-friendly paragraph HTML, one <p> per blank-line-separated block. */
function plainTextToHtml(text: string): string {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export type ImportableExtension = "txt" | "md";

export function getImportableExtension(filename: string): ImportableExtension | null {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  const ext = match?.[1]?.toLowerCase();
  if (ext === "txt" || ext === "md") return ext;
  return null;
}

/** Converts an uploaded .txt or .md file's raw text into editor-ready HTML. */
export function fileTextToDocumentHtml(text: string, ext: ImportableExtension): string {
  if (ext === "md") {
    const html = marked.parse(text, { async: false });
    return typeof html === "string" ? html : "";
  }
  return plainTextToHtml(text);
}

/** Derives a sensible document title from an uploaded filename. */
export function titleFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[a-z0-9]+$/i, "");
  const cleaned = withoutExt.replace(/[-_]+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : "Imported document";
}
