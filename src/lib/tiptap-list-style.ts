import { BulletList, OrderedList } from "@tiptap/extension-list";

/**
 * Adds a CSS `list-style-type` attribute to the bullet/ordered list nodes,
 * rendered as an inline `style` (mirrors the FontSize pattern), so the
 * toolbar can offer Google Docs-style bullet/number format variants.
 * No custom commands needed — `editor.commands.updateAttributes('bulletList', …)`
 * (a Tiptap core command) is enough once the attribute is registered.
 */
export const StyledBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      bulletStyle: {
        default: "disc",
        parseHTML: (element) => element.style.listStyleType || "disc",
        renderHTML: (attributes) => {
          if (!attributes.bulletStyle || attributes.bulletStyle === "disc") return {};
          return { style: `list-style-type: ${attributes.bulletStyle}` };
        },
      },
    };
  },
});

export const StyledOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      numberStyle: {
        default: "decimal",
        parseHTML: (element) => element.style.listStyleType || "decimal",
        renderHTML: (attributes) => {
          if (!attributes.numberStyle || attributes.numberStyle === "decimal") return {};
          return { style: `list-style-type: ${attributes.numberStyle}` };
        },
      },
    };
  },
});
