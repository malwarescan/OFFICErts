import { PrismaClient } from "@prisma/client";
import { encodeDevToken } from "@office-rts/shared";

const db = new PrismaClient();

async function bootstrap() {
  console.log("Bootstrapping test data...");

  // Create test org
  let org = await db.org.findFirst({ where: { name: "Test Org" } });
  if (!org) {
    org = await db.org.create({
      data: {
        name: "Test Org",
      },
    });
  }

  // Create test user
  let user = await db.user.findFirst({ where: { email: "test@example.com" } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        passwordHash: "dummy-hash",
      },
    });
  }

  // Create membership
  const existingMembership = await db.membership.findUnique({
    where: { orgId_userId: { orgId: org.id, userId: user.id } },
  });
  if (!existingMembership) {
    await db.membership.create({
      data: {
        orgId: org.id,
        userId: user.id,
      },
    });
  }

  // Create test room
  const room = await db.room.create({
    data: {
      name: "General",
      visibility: "PUBLIC",
      orgId: org.id,
    },
  });

  // Add user to room
  await db.roomMembership.create({
    data: {
      roomId: room.id,
      userId: user.id,
      orgId: org.id,
    },
  });

  // Create dev token
  const devToken = encodeDevToken({
    userId: user.id,
    orgId: org.id,
    email: user.email,
    name: user.name,
  });

  console.log("=== Bootstrap Complete ===");
  console.log(`Org ID: ${org.id}`);
  console.log(`User ID: ${user.id}`);
  console.log(`Room ID: ${room.id}`);
  console.log(`Dev Token: ${devToken}`);
  console.log(`Room URL: http://localhost:3000/org/${org.id}/room/${room.id}`);
  console.log("========================");
}

bootstrap()
  .catch(console.error)
  .finally(() => db.$disconnect());
