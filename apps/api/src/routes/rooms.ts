import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireDevMode } from "../middleware/auth";

export async function roomRoutes(fastify: FastifyInstance, db: PrismaClient) {
  // POST /orgs/:orgId/rooms - Create room
  fastify.post(
    "/orgs/:orgId/rooms",
    { preHandler: [requireAuth(), requireDevMode()] },
    async (request: any, reply) => {
      const { orgId } = request.params;
      const { name, visibility = "PUBLIC" } = request.body as any;
      const user = request.user;

      const room = await db.room.create({
        data: {
          name,
          visibility,
          orgId,
        },
      });

      // Auto-add creator to room
      await db.roomMembership.create({
        data: {
          roomId: room.id,
          userId: user.userId,
          orgId,
        },
      });

      return reply.status(201).send(room);
    }
  );

  // GET /orgs/:orgId/rooms - List rooms
  fastify.get(
    "/orgs/:orgId/rooms",
    { preHandler: [requireAuth(), requireDevMode()] },
    async (request: any, reply) => {
      const { orgId } = request.params;
      const user = request.user;

      const rooms = await db.room.findMany({
        where: {
          orgId,
          OR: [
            { visibility: "PUBLIC" },
            { 
              roomMemberships: {
                some: { userId }
              }
            }
          ]
        },
        include: {
          _count: {
            select: { roomMemberships: true }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(rooms);
    }
  );
}
