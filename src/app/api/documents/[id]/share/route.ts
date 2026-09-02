import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getRole, canManageSharing } from "@/lib/permissions";
import { shareDocumentSchema } from "@/lib/validation";
import { z } from "zod";

async function requireOwner(id: string, userId: string | undefined) {
  const doc = await prisma.document.findUnique({ where: { id }, include: { shares: true } });
  if (!doc) return { error: NextResponse.json({ error: "Document not found" }, { status: 404 }) };

  const role = getRole(doc, doc.shares, userId);
  if (!canManageSharing(role)) {
    return {
      error: NextResponse.json(
        { error: "Only the owner can manage sharing" },
        { status: 403 }
      ),
    };
  }
  return { doc };
}

async function currentShares(documentId: string) {
  const shares = await prisma.share.findMany({
    where: { documentId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return shares.map((s) => ({
    userId: s.userId,
    name: s.user.name,
    email: s.user.email,
    permission: s.permission,
  }));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const owned = await requireOwner(id, user.id);
  if (owned.error) return owned.error;

  const body = await req.json().catch(() => ({}));
  const parsed = shareDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!target) {
    return NextResponse.json(
      { error: `No user found with email ${parsed.data.email}` },
      { status: 404 }
    );
  }
  if (target.id === user.id) {
    return NextResponse.json(
      { error: "You already own this document" },
      { status: 400 }
    );
  }

  await prisma.share.upsert({
    where: { documentId_userId: { documentId: id, userId: target.id } },
    update: { permission: parsed.data.permission },
    create: { documentId: id, userId: target.id, permission: parsed.data.permission },
  });

  return NextResponse.json({ shares: await currentShares(id) }, { status: 201 });
}

const unshareSchema = z.object({ userId: z.string().min(1) });

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const owned = await requireOwner(id, user.id);
  if (owned.error) return owned.error;

  const body = await req.json().catch(() => ({}));
  const parsed = unshareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.share.deleteMany({ where: { documentId: id, userId: parsed.data.userId } });

  return NextResponse.json({ shares: await currentShares(id) });
}
