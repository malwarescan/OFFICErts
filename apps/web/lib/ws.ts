const WS_BASE = process.env.NEXT_PUBLIC_REALTIME_URL || 'ws://localhost:3002';

interface EventData {
  type: string;
  [key: string]: any;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private subscriptions = new Set<string>();
  private eventListeners = new Map<string, Function[]>();
  private connected = false;

  async connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.token = token;
      const wsUrl = `${WS_BASE}/ws`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        // Send HELLO message with protocol version
        this.ws!.send(JSON.stringify({
          type: 'HELLO',
          v: 1,
          token
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
          
          // Resolve promise when we receive CONNECTED message
          if (data.type === 'CONNECTED') {
            this.connected = true;
            resolve();
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        this.connected = false;
        this.subscriptions.clear();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      // Timeout for connection
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(data: any) {
    const { type } = data;

    switch (type) {
      case 'WELCOME':
        this.emit('welcome', data);
        break;
      case 'CONNECTED':
        this.emit('connected', data);
        break;
      case 'SUBSCRIBED':
        this.emit('subscribed', data);
        break;
      case 'UNSUBSCRIBED':
        this.emit('unsubscribed', data);
        break;
      case 'ROOM_MESSAGE_CREATED':
        this.emit('message', data);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  subscribeToRoom(roomId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.subscriptions.add(roomId);
    this.ws.send(JSON.stringify({
      type: 'SUBSCRIBE_ROOM',
      roomId,
    }));
  }

  unsubscribeFromRoom(roomId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.subscriptions.delete(roomId);
    this.ws.send(JSON.stringify({
      type: 'UNSUBSCRIBE_ROOM',
      roomId,
    }));
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.connected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const ws = new WebSocketClient();
