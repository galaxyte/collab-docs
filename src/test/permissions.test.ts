import { describe, it, expect } from "vitest";
import {
  getRole,
  canView,
  canEdit,
  canManageSharing,
  canDelete,
} from "@/lib/permissions";

const doc = { ownerId: "owner-1" };
const shares = [
  { userId: "editor-1", permission: "EDIT" },
  { userId: "viewer-1", permission: "VIEW" },
];

describe("getRole", () => {
  it("returns OWNER for the document owner", () => {
    expect(getRole(doc, shares, "owner-1")).toBe("OWNER");
  });

  it("returns EDIT for a user shared with edit access", () => {
    expect(getRole(doc, shares, "editor-1")).toBe("EDIT");
  });

  it("returns VIEW for a user shared with view access", () => {
    expect(getRole(doc, shares, "viewer-1")).toBe("VIEW");
  });

  it("returns NONE for a user with no relationship to the document", () => {
    expect(getRole(doc, shares, "stranger-1")).toBe("NONE");
  });

  it("returns NONE when there is no signed-in user", () => {
    expect(getRole(doc, shares, null)).toBe("NONE");
    expect(getRole(doc, shares, undefined)).toBe("NONE");
  });
});

describe("role capability checks", () => {
  it("only OWNER and EDIT can edit", () => {
    expect(canEdit("OWNER")).toBe(true);
    expect(canEdit("EDIT")).toBe(true);
    expect(canEdit("VIEW")).toBe(false);
    expect(canEdit("NONE")).toBe(false);
  });

  it("OWNER, EDIT and VIEW can all view", () => {
    expect(canView("OWNER")).toBe(true);
    expect(canView("EDIT")).toBe(true);
    expect(canView("VIEW")).toBe(true);
    expect(canView("NONE")).toBe(false);
  });

  it("only OWNER can manage sharing or delete the document", () => {
    for (const role of ["EDIT", "VIEW", "NONE"] as const) {
      expect(canManageSharing(role)).toBe(false);
      expect(canDelete(role)).toBe(false);
    }
    expect(canManageSharing("OWNER")).toBe(true);
    expect(canDelete("OWNER")).toBe(true);
  });
});
