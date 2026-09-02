import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Collab Docs</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Pick a seeded account to continue. This demo uses mocked auth
          instead of real passwords.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Couldn&apos;t sign you in. Please pick an account below.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {users.map((u) => (
          <form key={u.id} action={loginAs}>
            <input type="hidden" name="userId" value={u.id} />
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-medium text-white">
                {u.name.charAt(0)}
              </span>
              <span>
                <span className="block text-sm font-medium text-neutral-900">
                  {u.name}
                </span>
                <span className="block text-xs text-neutral-500">{u.email}</span>
              </span>
            </button>
          </form>
        ))}
      </div>

      {users.length === 0 && (
        <p className="text-center text-sm text-neutral-500">
          No seeded users found. Run <code>npm run db:seed</code> first.
        </p>
      )}
    </main>
  );
}
