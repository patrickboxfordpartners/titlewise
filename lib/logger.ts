type LogLevel = "info" | "warn" | "error"

function log(level: LogLevel, source: string, message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    ...data,
  }
  if (level === "error") {
    console.error(JSON.stringify(entry))
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  info: (source: string, message: string, data?: Record<string, unknown>) =>
    log("info", source, message, data),
  warn: (source: string, message: string, data?: Record<string, unknown>) =>
    log("warn", source, message, data),
  error: (source: string, message: string, data?: Record<string, unknown>) =>
    log("error", source, message, data),
}
