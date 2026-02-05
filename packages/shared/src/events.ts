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

// Message event payloads
export const RoomMessageCreatedPayloadSchema = z.object({
  message: z.object({
    id: z.string().uuid(),
    roomId: z.string().uuid(),
    body: z.string(),
    createdAt: z.string().datetime(),
    author: z.object({
      userId: z.string().uuid(),
      name: z.string(),
    }),
  }),
});

export type RoomMessageCreatedPayload = z.infer<typeof RoomMessageCreatedPayloadSchema>;

// Auth types for dev token
export const DevTokenSchema = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
});

export type DevToken = z.infer<typeof DevTokenSchema>;

// WebSocket protocol types
export const WS_PROTOCOL_VERSION = 1;

export const WSClientMessageSchema = z.union([
  z.object({
    type: z.literal("HELLO"),
    v: z.literal(WS_PROTOCOL_VERSION),
    token: z.string(),
  }),
  z.object({
    type: z.literal("SUBSCRIBE_ROOM"),
    roomId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("UNSUBSCRIBE_ROOM"),
    roomId: z.string().uuid(),
  }),
]);

export type WSClientMessage = z.infer<typeof WSClientMessageSchema>;

export const WSServerMessageSchema = z.union([
  z.object({
    type: z.literal("WELCOME"),
    v: z.literal(WS_PROTOCOL_VERSION),
  }),
  z.object({
    type: z.literal("CONNECTED"),
    userId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("SUBSCRIBED"),
    roomId: z.string().uuid(),
    count: z.number().int(),
  }),
  z.object({
    type: z.literal("UNSUBSCRIBED"),
    roomId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("ROOM_MESSAGE_CREATED"),
    payload: RoomMessageCreatedPayloadSchema,
  }),
]);

export type WSServerMessage = z.infer<typeof WSServerMessageSchema>;
