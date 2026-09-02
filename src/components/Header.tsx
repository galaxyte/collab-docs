import Link from "next/link";
import { logout } from "@/app/login/actions";

export function Header({ user }: { user: { name: string; email: string } }) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
      <Link href="/" className="text-sm font-semibold text-neutral-900">
        Collab Docs
      </Link>
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-neutral-900">{user.name}</p>
          <p className="text-xs text-neutral-500">{user.email}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Switch user
          </button>
        </form>
      </div>
    </header>
  );
}
