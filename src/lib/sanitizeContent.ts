import sanitizeHtml from "sanitize-html";

const BULLET_STYLE_VALUES = /^(disc|circle|square)$/;
const NUMBER_STYLE_VALUES = /^(decimal|lower-alpha|upper-alpha|lower-roman|upper-roman)$/;

/**
 * Allowlist mirrors the Tiptap schema in DocumentEditor (StarterKit +
 * Underline + the custom FontSize/TextStyle mark + the styled list nodes):
 * paragraphs, headings, emphasis, lists, line breaks, `span` for font-size,
 * and a `style` on `ul`/`ol` for bullet/number format. Every style value is
 * restricted by `allowedStyles` to an exact property + a fixed set of known
 * values (never an arbitrary string) — nothing else can go through it,
 * which also rules out event handlers and javascript: URLs. Document
 * content is stored as HTML, and PATCH /api/documents/[id] accepts that
 * HTML straight from the client, so it must be sanitized on every write
 * rather than trusted as "editor output".
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
      "span",
    ],
    allowedAttributes: {
      span: ["style"],
      ul: ["style"],
      ol: ["style"],
    },
    allowedStyles: {
      span: {
        "font-size": [/^\d+(?:\.\d+)?(?:px|pt|em|rem)$/],
      },
      ul: {
        "list-style-type": [BULLET_STYLE_VALUES],
      },
      ol: {
        "list-style-type": [NUMBER_STYLE_VALUES],
      },
    },
    disallowedTagsMode: "discard",
  });
}
