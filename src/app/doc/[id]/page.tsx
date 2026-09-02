import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getRole, canManageSharing, canDelete } from "@/lib/permissions";
import { Header } from "@/components/Header";
import { DocumentEditor } from "@/components/DocumentEditor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!doc) notFound();

  const role = getRole(doc, doc.shares, user.id);
  if (role === "NONE") notFound();

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header user={user} />
      <DocumentEditor
        documentId={doc.id}
        initialTitle={doc.title}
        initialContent={doc.content}
        role={role}
        owner={doc.owner}
        canManageSharing={canManageSharing(role)}
        canDelete={canDelete(role)}
        initialShares={doc.shares.map((s) => ({
          userId: s.userId,
          name: s.user.name,
          email: s.user.email,
          permission: s.permission as "VIEW" | "EDIT",
        }))}
      />
    </div>
  );
}
