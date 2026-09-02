import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  { name: "Ava Chen", email: "ava@example.com" },
  { name: "Ben Torres", email: "ben@example.com" },
  { name: "Cara Diallo", email: "cara@example.com" },
];

async function main() {
  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: u,
      })
    )
  );

  const [ava, ben] = users;

  const existing = await prisma.document.findFirst({
    where: { ownerId: ava.id, title: "Welcome to Collab Docs" },
  });

  if (!existing) {
    const doc = await prisma.document.create({
      data: {
        title: "Welcome to Collab Docs",
        ownerId: ava.id,
        content: `<h1>Welcome to Collab Docs</h1>
<p>This is a seeded sample document owned by <strong>Ava Chen</strong>.</p>
<p>It has been shared with <strong>Ben Torres</strong> so you can see the
difference between <em>owned</em> and <em>shared</em> documents right away.</p>
<ul>
<li>Try editing this text</li>
<li>Rename the document from the dashboard</li>
<li>Upload a .txt or .md file to create a new document</li>
</ul>`,
      },
    });

    await prisma.share.create({
      data: {
        documentId: doc.id,
        userId: ben.id,
        permission: "EDIT",
      },
    });
  }

  console.log("Seeded users:");
  for (const u of users) console.log(`  ${u.name} <${u.email}>`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
