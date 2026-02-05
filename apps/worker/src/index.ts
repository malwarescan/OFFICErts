import { Job, Worker } from "bullmq";
import Redis from "ioredis";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().min(1),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(3),
});

const env = EnvSchema.parse(process.env);

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

new Worker(
  "ai",
  async (job: Job) => {
    return { ok: true, jobId: job.id };
  },
  { connection, concurrency: env.WORKER_CONCURRENCY }
);
