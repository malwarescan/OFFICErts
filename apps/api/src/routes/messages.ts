import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { getEventsPublisher } from "../services/eventsPublisher";
import { EventTypeSchema, EventEnvelopeSchema } from "@office-rts/shared";
import { randomUUID } from "crypto";
import { z } from "zod";

const CreateMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function messageRoutes(fastify: FastifyInstance, db: PrismaClient) {
  // GET /rooms/:roomId/messages
  fastify.get(
    "/rooms/:roomId/messages",
    { preHandler: [requireAuth()] },
    async (request: any, reply) => {
      const { roomId } = request.params as { roomId: string };
      const userId = request.user.userId;
      const { limit = "50", cursor } = request.query as { limit?: string; cursor?: string };
      
      const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
      
      // Verify user is member of the room's org and room
      const room = await db.room.findUnique({
        where: { id: roomId },
        include: { org: true },
      });
      
      if (!room) {
        return reply.status(404).send({ error: "Room not found" });
      }
      
      const membership = await db.membership.findUnique({
        where: { orgId_userId: { orgId: room.orgId, userId } },
      });
      
      if (!membership) {
        return reply.status(403).send({ error: "Not a member of this organization" });
      }
      
      const roomMembership = await db.roomMembership.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      
      if (!roomMembership && room.visibility === "PRIVATE") {
        return reply.status(403).send({ error: "Not a member of this private room" });
      }
      
      const whereClause: any = { roomId };
      if (cursor) {
        whereClause.createdAt = { lt: new Date(cursor) };
      }
      
      const messages = await db.message.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limitNum,
      });
      
      return {
        messages: messages.reverse(), // Return oldest first for client convenience
        nextCursor: messages.length > 0 ? messages[0].createdAt.toISOString() : null,
      };
    }
  );

  // POST /rooms/:roomId/messages
  fastify.post(
    "/rooms/:roomId/messages",
    { preHandler: [requireAuth()] },
    async (request: any, reply) => {
      const { roomId } = request.params as { roomId: string };
      const userId = request.user.userId;
      const orgId = request.user.orgId;
      const userName = request.user.name;
      
      const body = CreateMessageSchema.parse(request.body);
      
      // Verify user is member of the room's org and room
      const room = await db.room.findUnique({
        where: { id: roomId },
      });
      
      if (!room) {
        return reply.status(404).send({ error: "Room not found" });
      }
      
      if (room.orgId !== orgId) {
        return reply.status(403).send({ error: "Room not in your organization" });
      }
      
      const roomMembership = await db.roomMembership.findUnique({
        where: { roomId_userId: { roomId, userId } },
      });
      
      if (!roomMembership && room.visibility === "PRIVATE") {
        return reply.status(403).send({ error: "Not a member of this private room" });
      }
      
      // Create message with userId (satisfies XOR constraint)
      const message = await db.message.create({
        data: {
          body: body.body,
          roomId,
          userId,
          orgId,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });
      
      // Publish event
      const event = EventEnvelopeSchema.parse({
        id: randomUUID(),
        type: EventTypeSchema.Enum.ROOM_MESSAGE_CREATED,
        orgId,
        roomId,
        actor: { userId },
        payload: {
          message: {
            id: message.id,
            roomId: message.roomId,
            body: message.body,
            createdAt: message.createdAt.toISOString(),
            author: {
              userId: message.user!.id,
              name: message.user!.name,
            },
          },
        },
        ts: Date.now(),
      });
      
      const publisher = getEventsPublisher();
      await publisher.publish(event);
      
      return reply.status(201).send(message);
    }
  );
}
