import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Header } from "@/components/Header";
import { NewDocumentButton } from "@/components/NewDocumentButton";
import { UploadButton } from "@/components/UploadButton";

function stripHtml(html: string, max = 140): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function DashboardPage() {
  const user = await requireUser();

  const [owned, sharedShares] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { shares: true } } },
    }),
    prisma.share.findMany({
      where: { userId: user.id },
      include: {
        document: { include: { owner: { select: { name: true, email: true } } } },
      },
      orderBy: { document: { updatedAt: "desc" } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header user={user} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-neutral-900">Your documents</h1>
          <div className="flex items-center gap-3">
            <UploadButton />
            <NewDocumentButton />
          </div>
        </div>
        <p className="mb-6 text-xs text-neutral-500">
          File import currently supports plain text (.txt) and Markdown (.md) files, up to 2MB.
        </p>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            My documents
          </h2>
          {owned.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
              No documents yet. Create one or upload a file to get started.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {owned.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/doc/${doc.id}`}
                    className="block h-full rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="font-medium text-neutral-900">{doc.title}</h3>
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                        Owner
                      </span>
                    </div>
                    <p className="mb-3 line-clamp-2 text-xs text-neutral-500">
                      {stripHtml(doc.content) || "Empty document"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Edited {formatDate(doc.updatedAt)}</span>
                      {doc._count.shares > 0 && (
                        <span>
                          Shared with {doc._count.shares}{" "}
                          {doc._count.shares === 1 ? "person" : "people"}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Shared with me
          </h2>
          {sharedShares.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
              Nothing has been shared with you yet.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sharedShares.map((share) => (
                <li key={share.id}>
                  <Link
                    href={`/doc/${share.document.id}`}
                    className="block h-full rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="font-medium text-neutral-900">{share.document.title}</h3>
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        {share.permission === "EDIT" ? "Can edit" : "Can view"}
                      </span>
                    </div>
                    <p className="mb-3 line-clamp-2 text-xs text-neutral-500">
                      {stripHtml(share.document.content) || "Empty document"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Edited {formatDate(share.document.updatedAt)}</span>
                      <span>Owned by {share.document.owner.name}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
