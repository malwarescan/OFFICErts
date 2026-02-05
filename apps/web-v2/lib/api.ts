const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Message {
  id: string;
  roomId: string;
  body: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface Room {
  id: string;
  name: string;
  visibility: string;
  createdAt: string;
  _count: {
    roomMemberships: number;
  };
}

export interface User {
  userId: string;
  orgId: string;
  email: string;
  name: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getRooms(orgId: string): Promise<Room[]> {
    return this.request<Room[]>(`/orgs/${orgId}/rooms`);
  }

  async createRoom(orgId: string, data: { name: string; visibility?: string }): Promise<Room> {
    return this.request<Room>(`/orgs/${orgId}/rooms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessages(roomId: string, limit = 50, cursor?: string): Promise<{
    messages: Message[];
    nextCursor: string | null;
  }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) {
      params.append('cursor', cursor);
    }
    return this.request<{ messages: Message[]; nextCursor: string | null }>(
      `/rooms/${roomId}/messages?${params}`
    );
  }

  async createMessage(roomId: string, body: string): Promise<Message> {
    return this.request<Message>(`/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }
}

export const api = new ApiClient();
