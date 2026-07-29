const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(opts: { interval: number; max: number }) {
  return {
    check: (key: string): { allowed: boolean; remaining: number } => {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + opts.interval });
        return { allowed: true, remaining: opts.max - 1 };
      }

      entry.count++;

      if (entry.count > opts.max) {
        return { allowed: false, remaining: 0 };
      }

      return { allowed: true, remaining: opts.max - entry.count };
    },
    reset: (key: string) => store.delete(key),
  };
}

export const apiLimiter = rateLimit({ interval: 60_000, max: 30 });
export const authLimiter = rateLimit({ interval: 60_000, max: 5 });
export const newsletterLimiter = rateLimit({ interval: 60_000, max: 3 });
export const scrapingLimiter = rateLimit({ interval: 300_000, max: 10 });
