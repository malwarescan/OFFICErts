import { FastifyRequest, FastifyReply } from "fastify";
import { decodeDevToken, DevToken } from "@office-rts/shared";

export interface AuthenticatedRequest extends FastifyRequest {
  user: DevToken;
}

export function requireAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Missing authorization header" });
    }

    const token = authHeader.slice(7);
    
    // Check if this is a dev token and if dev auth is allowed
    if (token.startsWith("dev_")) {
      const isDevAllowed = process.env.NODE_ENV === "development" || process.env.ALLOW_DEV_AUTH === "true";
      if (!isDevAllowed) {
        return reply.status(401).send({ 
          error: "Development authentication is disabled",
          code: "DEV_AUTH_DISABLED"
        });
      }
    }
    
    try {
      const user = decodeDevToken(token);
      (request as any).user = user;
    } catch (error) {
      return reply.status(401).send({ error: "Invalid token" });
    }
  };
}

export function requireDevMode() {
  return (request: FastifyRequest, reply: FastifyReply) => {
    if (process.env.NODE_ENV !== "development") {
      return reply.status(403).send({ error: "Dev tokens only allowed in development" });
    }
  };
}
