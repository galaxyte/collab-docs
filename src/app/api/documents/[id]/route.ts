import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getRole, canEdit, canDelete } from "@/lib/permissions";
import { updateDocumentSchema } from "@/lib/validation";
import { sanitizeDocumentContent } from "@/lib/sanitizeContent";

async function loadDocWithRole(id: string, userId: string | undefined) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { shares: true, owner: { select: { id: true, name: true, email: true } } },
  });
  if (!doc) return null;
  const role = getRole(doc, doc.shares, userId);
  return { doc, role };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const found = await loadDocWithRole(id, user?.id);

  if (!found || found.role === "NONE") {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { doc, role } = found;
  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    updatedAt: doc.updatedAt,
    owner: doc.owner,
    role,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const found = await loadDocWithRole(id, user.id);
  if (!found || found.role === "NONE") {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!canEdit(found.role)) {
    return NextResponse.json(
      { error: "You only have view access to this document" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.content !== undefined
        ? { content: sanitizeDocumentContent(parsed.data.content) }
        : {}),
    },
  });

  return NextResponse.json({ id: updated.id, title: updated.title, updatedAt: updated.updatedAt });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const found = await loadDocWithRole(id, user.id);
  if (!found || found.role === "NONE") {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!canDelete(found.role)) {
    return NextResponse.json(
      { error: "Only the owner can delete this document" },
      { status: 403 }
    );
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
