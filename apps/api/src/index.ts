import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";

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

await app.register(cors, {
  origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
});

app.get("/health", async () => ({ ok: true }));

await app.listen({ port: env.PORT, host: "0.0.0.0" });
