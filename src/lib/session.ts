import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "session_user_id";

/**
 * Mocked auth: the cookie just holds a seeded user's id, no password.
 * Good enough to demonstrate ownership/sharing without building real auth.
 */
export async function getCurrentUser() {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
