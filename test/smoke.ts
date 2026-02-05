import { createClient } from "redis";
import { WebSocket } from "ws";
import { encodeDevToken, EventEnvelopeSchema } from "@office-rts/shared";

// Configuration from environment
const API_URL = process.env.API_URL || "http://localhost:3001";
const REALTIME_URL = process.env.REALTIME_URL || "ws://localhost:3002";
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;

if (!DATABASE_URL || !REDIS_URL) {
  console.error("❌ DATABASE_URL and REDIS_URL environment variables are required");
  process.exit(1);
}

// Test data
const testOrgId = "550e8400-e29b-41d4-a716-446655440000";
const testUserId = "550e8400-e29b-41d4-a716-446655440001";
const testRoomId = "550e8400-e29b-41d4-a716-446655440002";
const testMessage = "Smoke test message at " + new Date().toISOString();

async function runSmokeTest() {
  console.log("🧪 Starting Room Chat v1 Smoke Test");
  console.log(`API URL: ${API_URL}`);
  console.log(`Realtime URL: ${REALTIME_URL}`);
  console.log("");

  try {
    // Step 1: Create dev token
    const devToken = encodeDevToken({
      userId: testUserId,
      orgId: testOrgId,
      email: "smoke-test@example.com",
      name: "Smoke Test User",
    });
    console.log("✅ Dev token created");

    // Step 2: Create message via API
    const messageResponse = await fetch(`${API_URL}/rooms/${testRoomId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${devToken}`,
      },
      body: JSON.stringify({ body: testMessage }),
    });

    if (!messageResponse.ok) {
      throw new Error(`API request failed: ${messageResponse.status} ${messageResponse.statusText}`);
    }

    const messageData = await messageResponse.json();
    console.log("✅ Message created via API:", messageData.id);

    // Step 3: Connect to WebSocket and wait for event
    const eventReceived = await new Promise((resolve, reject) => {
      const ws = new WebSocket(`${REALTIME_URL}/ws`);
      let authenticated = false;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("WebSocket test timeout"));
      }, 5000);

      ws.on("open", () => {
        console.log("🔌 WebSocket connected");
        // Send HELLO message
        ws.send(JSON.stringify({
          type: "HELLO",
          v: 1,
          token: devToken,
        }));
      });

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log("📨 Received WebSocket message:", message.type);

          if (message.type === "WELCOME") {
            console.log("✅ Protocol handshake successful");
            return;
          }

          if (message.type === "CONNECTED") {
            console.log("✅ WebSocket authenticated");
            authenticated = true;
            // Subscribe to room
            ws.send(JSON.stringify({
              type: "SUBSCRIBE_ROOM",
              roomId: testRoomId,
            }));
            return;
          }

          if (message.type === "SUBSCRIBED") {
            console.log("✅ Subscribed to room");
            return;
          }

          if (message.type === "ROOM_MESSAGE_CREATED") {
            clearTimeout(timeout);
            
            // Validate event envelope
            const event = EventEnvelopeSchema.safeParse(message);
            if (!event.success) {
              reject(new Error("Invalid event envelope received"));
              return;
            }

            // Check if this is our message
            if (event.data.payload.message.body === testMessage) {
              console.log("✅ Received correct message event via WebSocket");
              ws.close();
              resolve(true);
            } else {
              console.log("⚠️  Received different message");
            }
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      ws.on("close", () => {
        clearTimeout(timeout);
      });

      ws.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    if (!eventReceived) {
      throw new Error("Smoke test failed - event not received");
    }

    console.log("");
    console.log("🎉 Smoke test passed! Room Chat v1 is working correctly.");
    console.log("");
    console.log("✅ API endpoints working");
    console.log("✅ Redis event publishing working");
    console.log("✅ WebSocket real-time updates working");
    console.log("✅ Event contracts validated");

  } catch (error) {
    console.error("❌ Smoke test failed:", error);
    process.exit(1);
  }
}

// Redis verification (optional)
async function verifyRedisConnection() {
  try {
    const redis = createClient({ url: REDIS_URL });
    await redis.connect();
    await redis.ping();
    await redis.disconnect();
    console.log("✅ Redis connection verified");
    return true;
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    return false;
  }
}

// Run the test
async function main() {
  const redisOk = await verifyRedisConnection();
  if (!redisOk) {
    process.exit(1);
  }

  await runSmokeTest();
}

if (require.main === module) {
  main();
}
