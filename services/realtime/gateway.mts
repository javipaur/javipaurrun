import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { subscribeLive } from "../../src/lib/realtime";
import type { LiveMessage } from "../../src/lib/realtime";

const PORT = parseInt(process.env.GATEWAY_PORT || process.env.PORT || "3001", 10);

const rooms = new Map<string, Set<WebSocket>>();
const sseClients = new Map<string, Set<ServerResponse>>();

function addWs(room: string, ws: WebSocket): void {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);
}

function removeWs(room: string, ws: WebSocket): void {
  rooms.get(room)?.delete(ws);
  if (rooms.get(room)?.size === 0) rooms.delete(room);
}

function addSse(room: string, res: ServerResponse): void {
  if (!sseClients.has(room)) sseClients.set(room, new Set());
  sseClients.get(room)!.add(res);
}

function removeSse(room: string, res: ServerResponse): void {
  sseClients.get(room)?.delete(res);
  if (sseClients.get(room)?.size === 0) sseClients.delete(room);
}

function broadcast(room: string, message: LiveMessage): void {
  const payload = JSON.stringify(message);

  for (const ws of rooms.get(room) ?? []) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }

  for (const res of sseClients.get(room) ?? []) {
    res.write(`data: ${payload}\n\n`);
  }
}

function handleSse(req: IncomingMessage, res: ServerResponse, eventId: string): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ eventId })}\n\n`);

  addSse(eventId, res);

  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSse(eventId, res);
  });
}

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname.startsWith("/events/")) {
    const eventId = url.pathname.replace("/events/", "");
    if (!eventId) {
      res.writeHead(400);
      res.end("eventId requerido");
      return;
    }
    handleSse(req, res, eventId);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocketServer({ server, path: "/ws/" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const eventId = url.pathname.replace("/ws/", "");
  if (!eventId) {
    ws.close(1008, "eventId requerido");
    return;
  }

  addWs(eventId, ws);
  ws.send(JSON.stringify({ type: "connected", eventId }));

  ws.on("close", () => removeWs(eventId, ws));
  ws.on("error", () => removeWs(eventId, ws));
});

void subscribeLive((_channel, message) => {
  if (!message?.eventId) return;
  broadcast(message.eventId, message);
});

server.listen(PORT, () => {
  console.log(`Realtime gateway escuchando en el puerto ${PORT} (WS+SSE)`);
});