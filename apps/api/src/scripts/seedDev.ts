import { PrismaClient } from "@prisma/client";
import { encodeDevToken } from "@office-rts/shared";

const db = new PrismaClient();

const DEV_ORG_NAME = "Dev Org";
const DEV_USER_EMAIL = "dev@example.com";
const DEV_USER_NAME = "Dev User";
const DEV_ROOM_NAME = "general";

async function seedDev() {
  console.log("🌱 Seeding development data...");

  try {
    // Create or find dev org
    let org = await db.org.findFirst({ where: { name: DEV_ORG_NAME } });
    if (!org) {
      org = await db.org.create({
        data: {
          name: DEV_ORG_NAME,
        },
      });
    }

    // Create or find dev user
    let user = await db.user.findFirst({ where: { email: DEV_USER_EMAIL } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: DEV_USER_EMAIL,
          name: DEV_USER_NAME,
          passwordHash: "dev-password-hash",
        },
      });
    }

    // Create membership
    await db.membership.upsert({
      where: { orgId_userId: { orgId: org.id, userId: user.id } },
      update: {},
      create: {
        orgId: org.id,
        userId: user.id,
      },
    });

    // Create or find dev room
    let room = await db.room.findFirst({
      where: { 
        orgId: org.id, 
        name: DEV_ROOM_NAME 
      }
    });

    if (!room) {
      room = await db.room.create({
        data: {
          name: DEV_ROOM_NAME,
          orgId: org.id,
        },
      });
    }

    // Add user to room membership
    await db.roomMembership.upsert({
      where: { 
        roomId_userId: { 
          roomId: room.id, 
          userId: user.id 
        } 
      },
      update: {},
      create: {
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

    console.log("✅ Development data seeded successfully!");
    console.log("");
    console.log("=== Development Credentials ===");
    console.log(`Org ID: ${org.id}`);
    console.log(`User ID: ${user.id}`);
    console.log(`Room ID: ${room.id}`);
    console.log(`Dev Token: ${devToken}`);
    console.log("");
    console.log("=== URLs ===");
    const webUrl = process.env.APP_URL || "http://localhost:3000";
    const apiUrl = process.env.APP_URL?.replace("3000", "3001") || "http://localhost:3001";
    console.log(`Web App: ${webUrl}/org/${org.id}/room/${room.id}`);
    console.log(`API Base: ${apiUrl}`);
    console.log("========================");

  } catch (error) {
    console.error("❌ Failed to seed development data:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  seedDev();
}
