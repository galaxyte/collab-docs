import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { getAvatarColor } from "@/lib/avatarColor";
import { loginAs } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [user, { error }, users] = await Promise.all([
    getCurrentUser(),
    searchParams,
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xl font-bold text-white shadow-lg shadow-indigo-200">
            C
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Collab Docs
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Pick a seeded account to continue. This demo uses mocked auth
            instead of real passwords.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
            Couldn&apos;t sign you in. Please pick an account below.
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white/80 p-3 shadow-xl shadow-indigo-100/50 backdrop-blur-sm">
          {users.map((u) => {
            const color = getAvatarColor(u.email);
            return (
              <form key={u.id} action={loginAs}>
                <input type="hidden" name="userId" value={u.id} />
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left transition hover:border-indigo-100 hover:bg-indigo-50/70"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${color.bg} ${color.text}`}
                  >
                    {u.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-900">
                      {u.name}
                    </span>
                    <span className="block text-xs text-slate-500">{u.email}</span>
                  </span>
                </button>
              </form>
            );
          })}
        </div>

        {users.length === 0 && (
          <p className="mt-6 text-center text-sm text-slate-500">
            No seeded users found. Run <code>npm run db:seed</code> first.
          </p>
        )}
      </div>
    </main>
  );
}
