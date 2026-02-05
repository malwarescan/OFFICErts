import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { roomRoutes } from "./routes/rooms";
import { messageRoutes } from "./routes/messages";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().min(1),
  REALTIME_URL: z.string().min(1),
  APP_URL: z.string().min(1),
});

const env = EnvSchema.parse(process.env);

const app = Fastify({ logger: true });
const db = new PrismaClient();

await app.register(cors, {
  origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
});

// Register routes
await app.register(async (fastify) => roomRoutes(fastify, db));
await app.register(async (fastify) => messageRoutes(fastify, db));

app.get("/health", async () => ({ ok: true }));

await app.listen({ port: env.PORT, host: "0.0.0.0" });
