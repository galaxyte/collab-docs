import Link from "next/link";
import { logout } from "@/app/login/actions";
import { getAvatarColor } from "@/lib/avatarColor";

export function Header({ user }: { user: { name: string; email: string } }) {
  const color = getAvatarColor(user.email);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-indigo-100/70 bg-white/80 px-6 py-3 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm shadow-indigo-200">
          C
        </span>
        <span className="text-sm font-semibold tracking-tight text-slate-900">
          Collab Docs
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
          >
            {user.name.charAt(0)}
          </span>
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Switch user
          </button>
        </form>
      </div>
    </header>
  );
}
