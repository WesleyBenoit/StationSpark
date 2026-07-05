import { afterEach, describe, expect, it, vi } from "vitest";

import {
  addLogTransport,
  configureLogger,
  logger,
  type LogRecord
} from "@/lib/logger";

function captureRecords() {
  const records: LogRecord[] = [];
  configureLogger({ minLevel: "debug", transports: [(record) => records.push(record)] });
  return records;
}

afterEach(() => {
  // Restore a permissive default so tests don't leak configuration.
  configureLogger({ minLevel: "debug", transports: [] });
});

describe("logger", () => {
  it("passes level, message, and context to transports", () => {
    const records = captureRecords();

    logger.info("hello", { userId: "abc" });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ level: "info", message: "hello", context: { userId: "abc" } });
    expect(records[0].timestamp).toEqual(expect.any(String));
  });

  it("suppresses entries below the configured minimum level", () => {
    const records: LogRecord[] = [];
    configureLogger({ minLevel: "warn", transports: [(record) => records.push(record)] });

    logger.debug("noise");
    logger.info("still noise");
    logger.warn("important");
    logger.error("critical");

    expect(records.map((record) => record.level)).toEqual(["warn", "error"]);
  });

  it("isolates a throwing transport from other transports", () => {
    const good = vi.fn();
    configureLogger({
      minLevel: "debug",
      transports: [
        () => {
          throw new Error("transport failure");
        },
        good
      ]
    });

    expect(() => logger.error("boom")).not.toThrow();
    expect(good).toHaveBeenCalledOnce();
  });

  it("appends transports without dropping existing ones", () => {
    const first: LogRecord[] = [];
    const second: LogRecord[] = [];
    configureLogger({ minLevel: "debug", transports: [(record) => first.push(record)] });
    addLogTransport((record) => second.push(record));

    logger.info("fan-out");

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
  });
});
