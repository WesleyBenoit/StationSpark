import { afterEach, describe, expect, it, vi } from "vitest";

import { captureException, initErrorReporting } from "@/lib/errorReporting";
import { configureLogger, type LogRecord } from "@/lib/logger";

function captureLogs() {
  const records: LogRecord[] = [];
  configureLogger({ minLevel: "debug", transports: [(record) => records.push(record)] });
  return records;
}

afterEach(() => {
  // Reset to a no-op reporter and quiet logger between tests.
  initErrorReporting({ captureException: () => undefined });
  configureLogger({ minLevel: "debug", transports: [] });
});

describe("captureException", () => {
  it("logs the error at error level with source context", () => {
    const records = captureLogs();

    captureException(new Error("kaboom"), { source: "unit-test" });

    const errorRecord = records.find((record) => record.level === "error");
    expect(errorRecord?.message).toBe("kaboom");
    expect(errorRecord?.context).toMatchObject({ source: "unit-test" });
  });

  it("normalizes non-Error values into an Error message", () => {
    const records = captureLogs();

    captureException("just a string");

    expect(records.find((record) => record.level === "error")?.message).toBe("just a string");
  });

  it("forwards to the registered reporter", () => {
    captureLogs();
    const reporter = { captureException: vi.fn() };
    initErrorReporting(reporter);

    const error = new Error("forward me");
    captureException(error, { source: "svc" });

    expect(reporter.captureException).toHaveBeenCalledOnce();
    expect(reporter.captureException.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("never throws when the reporter itself throws", () => {
    captureLogs();
    initErrorReporting({
      captureException: () => {
        throw new Error("reporter down");
      }
    });

    expect(() => captureException(new Error("original"))).not.toThrow();
  });
});
