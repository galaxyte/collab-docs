import { describe, it, expect } from "vitest";
import { sanitizeDocumentContent } from "@/lib/sanitizeContent";

describe("sanitizeDocumentContent", () => {
  it("keeps tags allowed by the editor schema", () => {
    const html = "<h1>Title</h1><p>Some <strong>bold</strong> <em>text</em>.</p><ul><li>a</li></ul>";
    expect(sanitizeDocumentContent(html)).toBe(html);
  });

  it("strips script tags entirely, including their content", () => {
    const out = sanitizeDocumentContent('<p>hi</p><script>alert("xss")</script>');
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert");
  });

  it("strips disallowed tags but keeps their inner text", () => {
    const out = sanitizeDocumentContent('<img src=x onerror="alert(1)"><p>text</p>');
    expect(out).not.toContain("<img");
    expect(out).not.toContain("onerror");
    expect(out).toContain("<p>text</p>");
  });

  it("strips attributes even on allowed tags (e.g. inline event handlers)", () => {
    const out = sanitizeDocumentContent('<p onclick="alert(1)">click me</p>');
    expect(out).not.toContain("onclick");
    expect(out).toContain("click me");
  });
});
