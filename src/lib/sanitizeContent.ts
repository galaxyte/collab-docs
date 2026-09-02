import sanitizeHtml from "sanitize-html";

/**
 * Allowlist mirrors the Tiptap schema in DocumentEditor (StarterKit +
 * Underline): paragraphs, headings, emphasis, lists, and line breaks only.
 * No attributes are allowed anywhere, which also rules out event handlers
 * and javascript: URLs. Document content is stored as HTML, and PATCH
 * /api/documents/[id] accepts that HTML straight from the client, so it
 * must be sanitized on every write rather than trusted as "editor output".
 */
export function sanitizeDocumentContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "h1",
      "h2",
      "h3",
      "strong",
      "em",
      "u",
      "ul",
      "ol",
      "li",
      "br",
    ],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}
