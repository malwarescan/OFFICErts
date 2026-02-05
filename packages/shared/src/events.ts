import { z } from "zod";

export const EventTypeSchema = z.enum([
  "ROOM_MESSAGE_CREATED",
  "ARTIFACT_CREATED",
  "OUTPUT_CREATED",
  "OUTPUT_STATUS_CHANGED",
  "SEAT_CREATED",
  "SEAT_ASSIGNED",
  "PRESENCE_JOIN",
  "PRESENCE_LEAVE",
]);

export type EventType = z.infer<typeof EventTypeSchema>;

export const EventActorSchema = z.object({
  userId: z.string().uuid().optional(),
  seatId: z.string().uuid().optional(),
});

export type EventActor = z.infer<typeof EventActorSchema>;

export const EventEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: EventTypeSchema,
  orgId: z.string().uuid(),
  roomId: z.string().uuid().nullable(),
  actor: EventActorSchema,
  payload: z.unknown(),
  ts: z.number().int(),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
