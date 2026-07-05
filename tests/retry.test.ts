import { afterEach, describe, expect, it, vi } from "vitest";

import { configureLogger } from "@/lib/logger";
import { defaultShouldRetry, withRetry } from "@/lib/retry";

// Silence retry warnings during tests.
configureLogger({ minLevel: "error", transports: [] });

const noSleep = () => Promise.resolve();

afterEach(() => {
  vi.restoreAllMocks();
});

describe("withRetry", () => {
  it("returns immediately on first success", async () => {
    const operation = vi.fn().mockResolvedValue("ok");

    await expect(withRetry(operation, { sleep: noSleep })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledOnce();
  });

  it("retries transient failures up to the attempt limit then succeeds", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue("recovered");

    await expect(withRetry(operation, { attempts: 3, sleep: noSleep })).resolves.toBe("recovered");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("stops retrying and rethrows once attempts are exhausted", async () => {
    const error = { status: 500 };
    const operation = vi.fn().mockRejectedValue(error);

    await expect(withRetry(operation, { attempts: 2, sleep: noSleep })).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry when shouldRetry returns false", async () => {
    const error = { status: 400 };
    const operation = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(operation, { attempts: 5, sleep: noSleep, shouldRetry: () => false })
    ).rejects.toBe(error);
    expect(operation).toHaveBeenCalledOnce();
  });
});

describe("defaultShouldRetry", () => {
  it("retries 5xx and rate-limit responses", () => {
    expect(defaultShouldRetry({ status: 500 })).toBe(true);
    expect(defaultShouldRetry({ status: 503 })).toBe(true);
    expect(defaultShouldRetry({ status: 429 })).toBe(true);
  });

  it("does not retry client errors", () => {
    expect(defaultShouldRetry({ status: 400 })).toBe(false);
    expect(defaultShouldRetry({ status: 404 })).toBe(false);
  });

  it("does not retry PostgREST request errors", () => {
    expect(defaultShouldRetry({ code: "PGRST116" })).toBe(false);
  });

  it("retries network-ish errors", () => {
    expect(defaultShouldRetry({ message: "Network request failed" })).toBe(true);
    expect(defaultShouldRetry({ message: "fetch timeout" })).toBe(true);
  });
});
