import { DevToken, DevTokenSchema } from "./events";

/**
 * Development-only authentication token
 * 
 * WARNING: This is for local development only. Never use in production.
 * 
 * Token format: dev_<base64_encoded_json>
 * 
 * Environment variables to control dev auth:
 * - NODE_ENV=development: Allows dev tokens by default
 * - ALLOW_DEV_AUTH=true: Explicitly enables dev tokens in any environment
 * 
 * Production behavior:
 * - When NODE_ENV=production and ALLOW_DEV_AUTH is not set, dev tokens are rejected
 * - Returns 401 with code "DEV_AUTH_DISABLED"
 */
export function encodeDevToken(token: DevToken): string {
  const payload = btoa(JSON.stringify(token));
  return `dev_${payload}`;
}

export function decodeDevToken(token: string): DevToken {
  if (!token.startsWith("dev_")) {
    throw new Error("Invalid dev token format");
  }
  
  const payload = token.slice(4);
  const decoded = JSON.parse(atob(payload));
  return DevTokenSchema.parse(decoded);
}

/**
 * Create a development token with the required frozen contract fields
 * 
 * @param userId - User UUID
 * @param orgId - Organization UUID  
 * @param email - User email address
 * @param name - User display name
 * @returns DevToken object that can be encoded
 */
export function createDevToken(userId: string, orgId: string, email: string, name: string): DevToken {
  return { userId, orgId, email, name };
}
