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
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Your documents
          </h1>
          <div className="flex items-center gap-3">
            <UploadButton />
            <NewDocumentButton />
          </div>
        </div>
        <p className="mb-8 text-xs text-slate-500">
          File import currently supports plain text (.txt) and Markdown (.md) files, up to 2MB.
        </p>

        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-indigo-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              My documents
            </h2>
          </div>
          {owned.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
              No documents yet. Create one or upload a file to get started.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {owned.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/doc/${doc.id}`}
                    className="block h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-900">{doc.title}</h3>
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                        Owner
                      </span>
                    </div>
                    <p className="mb-3 line-clamp-2 text-xs text-slate-500">
                      {stripHtml(doc.content) || "Empty document"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
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
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Shared with me
            </h2>
          </div>
          {sharedShares.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-sky-200 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
              Nothing has been shared with you yet.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sharedShares.map((share) => (
                <li key={share.id}>
                  <Link
                    href={`/doc/${share.document.id}`}
                    className="block h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-100"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-900">{share.document.title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          share.permission === "EDIT"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {share.permission === "EDIT" ? "Can edit" : "Can view"}
                      </span>
                    </div>
                    <p className="mb-3 line-clamp-2 text-xs text-slate-500">
                      {stripHtml(share.document.content) || "Empty document"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
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
