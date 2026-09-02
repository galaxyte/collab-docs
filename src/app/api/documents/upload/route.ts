import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  fileTextToDocumentHtml,
  getImportableExtension,
  titleFromFilename,
} from "@/lib/fileImport";
import { MAX_UPLOAD_BYTES } from "@/lib/validation";
import { sanitizeDocumentContent } from "@/lib/sanitizeContent";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 2MB" },
      { status: 400 }
    );
  }

  const ext = getImportableExtension(file.name);
  if (!ext) {
    return NextResponse.json(
      { error: "Only .txt and .md files are supported" },
      { status: 400 }
    );
  }

  const text = await file.text();
  const content = sanitizeDocumentContent(fileTextToDocumentHtml(text, ext));

  const doc = await prisma.document.create({
    data: {
      title: titleFromFilename(file.name),
      content,
      ownerId: user.id,
    },
  });

  return NextResponse.json({ id: doc.id }, { status: 201 });
}
