import http from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import Redis from "ioredis";
import { z } from "zod";
import { EventEnvelopeSchema } from "@office-rts/shared";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3002),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().min(1),
});

const env = EnvSchema.parse(process.env);

const server = http.createServer();
const wss = new WebSocketServer({ server });

const sub = new Redis(env.REDIS_URL);

wss.on("connection", (ws: WebSocket) => {
  ws.send(JSON.stringify({ type: "CONNECTED" }));
});

sub.subscribe("events");
sub.on("message", (_channel: string, message: string) => {
  let json: unknown;
  try {
    json = JSON.parse(message);
  } catch {
    return;
  }

  const parsed = EventEnvelopeSchema.safeParse(json);
  if (!parsed.success) return;

  const data = JSON.stringify(parsed.data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
});

server.listen(env.PORT, "0.0.0.0");
