import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { DEMO_CREDENTIALS } from "@/lib/credentials";
import { loginAs } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [user, { error }, userCount] = await Promise.all([
    getCurrentUser(),
    searchParams,
    prisma.user.count(),
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
            Sign in with one of the demo accounts below.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">
            Incorrect email or password.
          </p>
        )}

        <form
          action={loginAs}
          className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-xl shadow-indigo-100/50 backdrop-blur-sm"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-600">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ava@example.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-600">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="submit"
            className="mt-1 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:shadow-md hover:shadow-indigo-200"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-dashed border-indigo-200 bg-white/60 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Demo accounts
          </p>
          <ul className="space-y-1 text-xs text-slate-600">
            {Object.entries(DEMO_CREDENTIALS).map(([email, password]) => (
              <li key={email}>
                <span className="font-medium text-slate-800">{email}</span>
                {" / "}
                <span className="font-mono">{password}</span>
              </li>
            ))}
          </ul>
        </div>

        {userCount === 0 && (
          <p className="mt-6 text-center text-sm text-slate-500">
            No seeded users found. Run <code>npm run db:seed</code> first.
          </p>
        )}
      </div>
    </main>
  );
}
