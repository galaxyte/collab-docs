import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createDocumentSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const doc = await prisma.document.create({
    data: {
      title: parsed.data.title,
      ownerId: user.id,
      content: "",
    },
  });

  return NextResponse.json({ id: doc.id }, { status: 201 });
}
