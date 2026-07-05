/**
 * Retry with exponential backoff for transient failures.
 *
 * Intended for network-bound calls (Supabase RPC/REST, storage uploads) that
 * can fail intermittently. Non-transient errors — validation, auth, and
 * business-rule rejections — should NOT be retried, so callers pass a
 * `shouldRetry` predicate (a sensible default is provided).
 */

import { logger } from "@/lib/logger";

export interface RetryOptions {
  /** Maximum number of attempts, including the first. Default 3. */
  attempts?: number;
  /** Base delay in milliseconds for the first backoff. Default 300. */
  baseDelayMs?: number;
  /** Upper bound on any single backoff delay. Default 4000. */
  maxDelayMs?: number;
  /** Decide whether a given error is worth retrying. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Injectable sleep, primarily for tests. */
  sleep?: (ms: number) => Promise<void>;
  /** Label used in retry logs. */
  label?: string;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Default policy: retry on network-ish errors and 5xx / rate-limit responses,
 * but never on client errors (4xx other than 429) or explicit validation.
 */
export function defaultShouldRetry(error: unknown): boolean {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;

    const status = typeof record.status === "number" ? record.status : undefined;
    if (status !== undefined) {
      if (status === 429) return true;
      return status >= 500;
    }

    // Supabase/PostgREST errors expose a string `code`; PostgREST client errors
    // start with "PGRST" and represent request problems that won't self-heal.
    const code = typeof record.code === "string" ? record.code : undefined;
    if (code && code.startsWith("PGRST")) return false;

    const message = typeof record.message === "string" ? record.message.toLowerCase() : "";
    if (message.includes("network") || message.includes("timeout") || message.includes("fetch")) {
      return true;
    }
  }

  // Unknown/opaque failures are treated as potentially transient.
  return true;
}

function computeDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  const capped = Math.min(exponential, maxDelayMs);
  // Full jitter avoids synchronized retry storms across clients.
  return Math.round(Math.random() * capped);
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    attempts = 3,
    baseDelayMs = 300,
    maxDelayMs = 4000,
    shouldRetry = defaultShouldRetry,
    sleep = defaultSleep,
    label = "operation"
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const canRetry = attempt < attempts && shouldRetry(error, attempt);
      if (!canRetry) break;

      const delay = computeDelay(attempt, baseDelayMs, maxDelayMs);
      logger.warn(`Retrying ${label}`, { attempt, nextDelayMs: delay });
      await sleep(delay);
    }
  }

  throw lastError;
}
