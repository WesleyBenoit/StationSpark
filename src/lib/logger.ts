/**
 * Structured, leveled logging with a pluggable transport.
 *
 * Product code should log through this module instead of calling `console.*`
 * directly, so that in production a single transport can forward warnings and
 * errors to a remote sink (see `@/lib/errorReporting`) while development keeps
 * readable console output.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogRecord {
  level: LogLevel;
  message: string;
  /** Structured, non-sensitive context to attach to the entry. */
  context?: Record<string, unknown>;
  timestamp: string;
}

export type LogTransport = (record: LogRecord) => void;

const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const consoleMethod: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug ?? console.log,
  info: console.info ?? console.log,
  warn: console.warn ?? console.log,
  error: console.error ?? console.log
};

export const consoleTransport: LogTransport = (record) => {
  const prefix = `[${record.level.toUpperCase()}] ${record.message}`;
  if (record.context) {
    consoleMethod[record.level](prefix, record.context);
  } else {
    consoleMethod[record.level](prefix);
  }
};

interface LoggerConfig {
  minLevel: LogLevel;
  transports: LogTransport[];
}

const config: LoggerConfig = {
  // Quieten debug noise unless explicitly enabled.
  minLevel: process.env.NODE_ENV === "production" ? "info" : "debug",
  transports: [consoleTransport]
};

/** Replace the active transports (e.g. add a remote sink in production). */
export function configureLogger(options: Partial<LoggerConfig>) {
  if (options.minLevel) config.minLevel = options.minLevel;
  if (options.transports) config.transports = options.transports;
}

/** Append a transport without removing existing ones. */
export function addLogTransport(transport: LogTransport) {
  config.transports = [...config.transports, transport];
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (levelRank[level] < levelRank[config.minLevel]) return;

  const record: LogRecord = {
    level,
    message,
    context,
    timestamp: new Date().toISOString()
  };

  for (const transport of config.transports) {
    try {
      transport(record);
    } catch {
      // A failing transport must never take down the caller.
    }
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context)
};
