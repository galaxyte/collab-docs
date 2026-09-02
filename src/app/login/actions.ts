"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function loginAs(formData: FormData) {
  const parsed = loginSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) redirect("/login?error=invalid");

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) redirect("/login?error=not-found");

  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
