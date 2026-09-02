export type Role = "OWNER" | "EDIT" | "VIEW" | "NONE";

export type ShareLike = { userId: string; permission: string };
export type DocumentLike = { ownerId: string };

/**
 * Pure permission resolver, kept free of Prisma/Next types so it can be
 * unit tested without a database or request context.
 */
export function getRole(
  doc: DocumentLike,
  shares: ShareLike[],
  userId: string | null | undefined
): Role {
  if (!userId) return "NONE";
  if (doc.ownerId === userId) return "OWNER";

  const share = shares.find((s) => s.userId === userId);
  if (!share) return "NONE";

  return share.permission === "EDIT" ? "EDIT" : "VIEW";
}

export function canView(role: Role): boolean {
  return role === "OWNER" || role === "EDIT" || role === "VIEW";
}

export function canEdit(role: Role): boolean {
  return role === "OWNER" || role === "EDIT";
}

export function canManageSharing(role: Role): boolean {
  return role === "OWNER";
}

export function canDelete(role: Role): boolean {
  return role === "OWNER";
}
