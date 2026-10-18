import { Response } from 'express';
import { Room } from '../types';

interface SseClient {
  id: string;
  res: Response;
  roomCode: string;
}

const roomClients = new Map<string, Set<SseClient>>();

export function addSseClient(roomCode: string, res: Response, initialRoom?: Room | null): () => void {
  const normalized = roomCode.toUpperCase();
  const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx, Caddy)
  res.flushHeaders?.();

  const client: SseClient = {
    id: clientId,
    res,
    roomCode: normalized,
  };

  if (!roomClients.has(normalized)) {
    roomClients.set(normalized, new Set());
  }
  roomClients.get(normalized)!.add(client);

  // Send initial connected event
  sendSseMessage(res, 'connected', { clientId, roomCode: normalized, timestamp: Date.now() });

  if (initialRoom) {
    sendSseMessage(res, 'room:update', initialRoom);
  }

  const cleanup = () => {
    const clients = roomClients.get(normalized);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        roomClients.delete(normalized);
      }
    }
  };

  return cleanup;
}

export function broadcastToRoom(roomCode: string, event: string, data: unknown): void {
  const normalized = roomCode.toUpperCase();
  const clients = roomClients.get(normalized);
  if (!clients || clients.size === 0) return;

  for (const client of clients) {
    try {
      sendSseMessage(client.res, event, data);
    } catch (err) {
      console.warn(`[SSE] Failed to send message to client ${client.id} in room ${normalized}:`, err);
    }
  }
}

function sendSseMessage(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Keep-alive heartbeat every 15 seconds
setInterval(() => {
  for (const [, clients] of roomClients.entries()) {
    for (const client of clients) {
      try {
        client.res.write(': keepalive\n\n');
      } catch {
        // Client disconnected, cleanup will trigger on close
      }
    }
  }
}, 15000);
