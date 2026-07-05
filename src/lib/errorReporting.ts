/**
 * Pluggable error reporting.
 *
 * By default this is a no-op that routes through the logger, so the app never
 * depends on a specific vendor. To enable a remote service (e.g. Sentry),
 * call `initErrorReporting` once at startup with a reporter implementation.
 */

import { logger } from "@/lib/logger";

export interface ErrorContext {
  /** Where the error originated, e.g. "ErrorBoundary" or "inviteService.sendInvite". */
  source?: string;
  /** Additional non-sensitive breadcrumbs. */
  extra?: Record<string, unknown>;
}

export interface ErrorReporter {
  captureException: (error: unknown, context?: ErrorContext) => void;
}

let reporter: ErrorReporter | null = null;

/** Register the active error reporter. Safe to call once at app startup. */
export function initErrorReporting(activeReporter: ErrorReporter) {
  reporter = activeReporter;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(typeof value === "string" ? value : JSON.stringify(value));
}

/**
 * Report an exception. Always logs; additionally forwards to the registered
 * remote reporter when one is configured. Never throws.
 */
export function captureException(error: unknown, context?: ErrorContext) {
  const normalized = toError(error);

  logger.error(normalized.message, {
    source: context?.source,
    ...context?.extra,
    stack: normalized.stack
  });

  if (reporter) {
    try {
      reporter.captureException(normalized, context);
    } catch (reporterError) {
      logger.warn("Error reporter threw while capturing an exception", {
        reporterError: toError(reporterError).message
      });
    }
  }
}
