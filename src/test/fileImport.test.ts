import { describe, it, expect } from "vitest";
import {
  getImportableExtension,
  fileTextToDocumentHtml,
  titleFromFilename,
} from "@/lib/fileImport";

describe("getImportableExtension", () => {
  it("accepts .txt and .md, case-insensitively", () => {
    expect(getImportableExtension("notes.txt")).toBe("txt");
    expect(getImportableExtension("notes.MD")).toBe("md");
  });

  it("rejects unsupported extensions", () => {
    expect(getImportableExtension("resume.docx")).toBeNull();
    expect(getImportableExtension("noextension")).toBeNull();
  });
});

describe("fileTextToDocumentHtml", () => {
  it("converts markdown headings, emphasis, and lists to HTML", () => {
    const html = fileTextToDocumentHtml(
      "# Title\n\nSome **bold** text.\n\n- a\n- b\n",
      "md"
    );
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<li>a</li>");
  });

  it("wraps plain text paragraphs in <p> tags and escapes HTML", () => {
    const html = fileTextToDocumentHtml("First para.\n\n<script>bad</script>", "txt");
    expect(html).toContain("<p>First para.</p>");
    expect(html).toContain("&lt;script&gt;bad&lt;/script&gt;");
    expect(html).not.toContain("<script>bad</script>");
  });
});

describe("titleFromFilename", () => {
  it("strips the extension and cleans separators", () => {
    expect(titleFromFilename("q3-project_notes.md")).toBe("q3 project notes");
  });

  it("falls back to a default title for empty names", () => {
    expect(titleFromFilename(".md")).toBe("Imported document");
  });
});
