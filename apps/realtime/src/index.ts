import http from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import Redis from "ioredis";
import { z } from "zod";
import { decodeDevToken, EventEnvelopeSchema, WSClientMessageSchema, WSServerMessageSchema, WS_PROTOCOL_VERSION } from "@office-rts/shared";
import { subscriptionManager } from "./subscriptions";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3002),
  REDIS_URL: z.string().min(1),
});

const env = EnvSchema.parse(process.env);

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});
const wss = new WebSocketServer({ server });

const sub = new Redis(env.REDIS_URL);

wss.on("connection", async (ws: WebSocket, request) => {
  let user: any = null;
  let authenticated = false;

  const sendMessage = (message: any) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      const parsed = WSClientMessageSchema.safeParse(message);
      
      if (!parsed.success) {
        sendMessage({ error: "Invalid message format" });
        return;
      }

      handleClientMessage(ws, user, parsed.data, sendMessage);
    } catch (error) {
      sendMessage({ error: "Invalid message format" });
    }
  });

  ws.on("close", () => {
    if (authenticated && user) {
      subscriptionManager.removeConnection(ws);
    }
  });

  // Send welcome message
  sendMessage({ type: "WELCOME", v: WS_PROTOCOL_VERSION });
});

function handleClientMessage(ws: WebSocket, user: any, message: any, sendMessage: (msg: any) => void) {
  switch (message.type) {
    case "HELLO":
      try {
        user = decodeDevToken(message.token);
        subscriptionManager.addConnection(ws, user.orgId);
        
        sendMessage({ 
          type: "CONNECTED", 
          userId: user.userId 
        });
      } catch (error) {
        ws.close(1008, "Invalid token");
      }
      break;

    case "SUBSCRIBE_ROOM":
      if (!user) {
        ws.close(1008, "Not authenticated");
        return;
      }

      if (message.roomId && typeof message.roomId === "string") {
        const success = subscriptionManager.subscribeToRoom(ws, message.roomId);
        if (success) {
          sendMessage({ 
            type: "SUBSCRIBED", 
            roomId: message.roomId,
            count: subscriptionManager.getRoomCount(user.orgId, message.roomId)
          });
        } else {
          sendMessage({ error: "Failed to subscribe to room" });
        }
      }
      break;

    case "UNSUBSCRIBE_ROOM":
      if (!user) {
        ws.close(1008, "Not authenticated");
        return;
      }

      if (message.roomId && typeof message.roomId === "string") {
        subscriptionManager.unsubscribeFromRoom(ws, message.roomId);
        sendMessage({ 
          type: "UNSUBSCRIBED", 
          roomId: message.roomId 
        });
      }
      break;

    default:
      sendMessage({ error: "Unknown message type" });
  }
}

sub.subscribe("events");
sub.on("message", (_channel: string, message: string) => {
  let json: unknown;
  try {
    json = JSON.parse(message);
  } catch {
    console.error("Failed to parse Redis message as JSON:", message);
    return;
  }

  const parsed = EventEnvelopeSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Invalid event envelope received from Redis:", parsed.error);
    return;
  }

  const event = parsed.data;
  if (event.roomId) {
    subscriptionManager.broadcastToRoom(event.orgId, event.roomId, event);
  }
});


server.listen(env.PORT, "0.0.0.0", () => {
  console.log(`WebSocket server listening on port ${env.PORT}`);
});
