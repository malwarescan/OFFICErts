import { WebSocket } from "ws";

interface Subscription {
  ws: WebSocket;
  orgId: string;
  roomIds: Set<string>;
}

export class SubscriptionManager {
  private connections = new Map<WebSocket, Subscription>();

  addConnection(ws: WebSocket, orgId: string): void {
    this.connections.set(ws, {
      ws,
      orgId,
      roomIds: new Set(),
    });
  }

  removeConnection(ws: WebSocket): void {
    this.connections.delete(ws);
  }

  subscribeToRoom(ws: WebSocket, roomId: string): boolean {
    const subscription = this.connections.get(ws);
    if (!subscription) return false;

    if (subscription.orgId) {
      subscription.roomIds.add(roomId);
      return true;
    }
    return false;
  }

  unsubscribeFromRoom(ws: WebSocket, roomId: string): void {
    const subscription = this.connections.get(ws);
    if (subscription) {
      subscription.roomIds.delete(roomId);
    }
  }

  broadcastToRoom(orgId: string, roomId: string, message: any): void {
    for (const [ws, subscription] of this.connections) {
      if (subscription.orgId === orgId && subscription.roomIds.has(roomId)) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      }
    }
  }

  getRoomCount(orgId: string, roomId: string): number {
    let count = 0;
    for (const subscription of this.connections.values()) {
      if (subscription.orgId === orgId && subscription.roomIds.has(roomId)) {
        count++;
      }
    }
    return count;
  }
}

export const subscriptionManager = new SubscriptionManager();
