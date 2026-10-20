import { createClient, type RedisClientType } from "redis";

const CHANNEL_PREFIX = "live:";

let client: RedisClientType | null = null;
let errorLogged = false;

function getClient(): RedisClientType | null {
  if (!process.env.REDIS_URL) return null;

  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
    (client as RedisClientType).connect().catch((err) => {
      console.error("Redis connect error:", err.message);
    });
  }
  return client;
}

export interface LiveMessage {
  eventId: string;
  type: "position" | "checkpoint" | "status" | "snapshot";
  data: Record<string, unknown>;
}

export function liveChannel(eventId: string): string {
  return `${CHANNEL_PREFIX}${eventId}`;
}

export function eventFromChannel(channel: string): string | null {
  if (!channel.startsWith(CHANNEL_PREFIX)) return null;
  return channel.slice(CHANNEL_PREFIX.length);
}

export async function publishLive(message: LiveMessage): Promise<void> {
  try {
    const redis = getClient();
    if (!redis) return;
    await redis.publish(liveChannel(message.eventId), JSON.stringify(message));
  } catch (err) {
    if (!errorLogged) {
      errorLogged = true;
      console.error("Redis publish error:", err);
    }
  }
}

export async function subscribeLive(
  onMessage: (channel: string, message: LiveMessage) => void
): Promise<() => void> {
  const redis = getClient();
  if (!redis) {
    await onUnavailable();
    return () => {};
  }

  await redis.pSubscribe("live:*", (message, channel) => {
    try {
      onMessage(channel, JSON.parse(message) as LiveMessage);
    } catch {
      // mensaje no parseable -> ignorar
    }
  });

  return () => {
    redis.pUnsubscribe("live:*").catch(() => {});
  };
}

async function onUnavailable(): Promise<void> {
  console.warn("REDIS_URL no configurado: el gateway no recibe eventos en tiempo real.");
}