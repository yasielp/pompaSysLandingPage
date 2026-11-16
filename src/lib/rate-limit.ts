import { randomInt } from "node:crypto";

// In-memory limiter (single Node process): an IP may send MAX_PER_WINDOW messages
// inside WINDOW_MS. Past that it is blocked for a random time between
// MIN_BLOCK_MS and MAX_BLOCK_MS, so the wait can't be predicted or timed by a bot.
// The block is fixed when it starts; further attempts while blocked do not extend it.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MIN_BLOCK_MS = 10 * 60 * 1000;
const MAX_BLOCK_MS = 30 * 60 * 1000;

type Entry = { times: number[]; blockedUntil: number };
const entries = new Map<string, Entry>();

/** Returns true when this request must be rejected (and counts it otherwise). */
export function isRateLimited(key: string, now = Date.now()): boolean {
  const entry = entries.get(key) ?? { times: [], blockedUntil: 0 };

  if (entry.blockedUntil > now) return true;

  // A block that just ended starts the IP from a clean slate.
  if (entry.blockedUntil) {
    entry.times = [];
    entry.blockedUntil = 0;
  }

  entry.times = entry.times.filter((t) => now - t < WINDOW_MS);

  if (entry.times.length >= MAX_PER_WINDOW) {
    entry.blockedUntil = now + randomInt(MIN_BLOCK_MS, MAX_BLOCK_MS + 1);
    entries.set(key, entry);
    return true;
  }

  entry.times.push(now);
  entries.set(key, entry);

  // Keep memory bounded: drop IPs with no recent hits and no active block.
  if (entries.size > 5000) {
    for (const [k, e] of entries) {
      if (e.blockedUntil <= now && e.times.every((t) => now - t >= WINDOW_MS)) entries.delete(k);
    }
  }
  return false;
}

// Generic sliding-window counter for the other limits (per recipient email, global).
const buckets = new Map<string, number[]>();

/** Counts one use of `key` in `bucket`; returns false when the limit is already reached. */
export function consume(bucket: string, key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const id = `${bucket}:${key}`;
  const recent = (buckets.get(id) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    buckets.set(id, recent);
    return false;
  }
  recent.push(now);
  buckets.set(id, recent);

  if (buckets.size > 5000) {
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}
