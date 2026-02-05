import { createClient } from "redis";
import { EventEnvelope, EventEnvelopeSchema } from "@office-rts/shared";

export class EventsPublisher {
  private redis: ReturnType<typeof createClient>;

  constructor(redisUrl: string) {
    this.redis = createClient({ url: redisUrl });
  }

  async connect() {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
  }

  async publish(event: EventEnvelope) {
    // Validate event envelope before publishing
    const validatedEvent = EventEnvelopeSchema.parse(event);
    
    await this.connect();
    await this.redis.publish("events", JSON.stringify(validatedEvent));
  }

  async disconnect() {
    if (this.redis.isOpen) {
      await this.redis.disconnect();
    }
  }
}

let publisher: EventsPublisher | null = null;

export function getEventsPublisher(): EventsPublisher {
  if (!publisher) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL environment variable is required");
    }
    publisher = new EventsPublisher(redisUrl);
  }
  return publisher;
}
