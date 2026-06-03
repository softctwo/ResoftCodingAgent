export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

export class Logger {
  private level: number;
  private prefix: string;

  constructor(namespace = "resoft") {
    const envLevel = (process.env.RESOFT_LOG_LEVEL?.toLowerCase() ?? "info") as LogLevel;
    this.level = LEVELS[envLevel] ?? LEVELS.info;
    this.prefix = namespace;
  }

  private log(level: LogLevel, ...args: unknown[]): void {
    if (LEVELS[level] < this.level) return;
    const color = COLORS[level];
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const label = level.toUpperCase().padEnd(5);
    console.error(`${color}[${timestamp} ${label} ${this.prefix}]${RESET}`, ...args);
  }

  debug(...args: unknown[]): void { this.log("debug", ...args); }
  info(...args: unknown[]): void { this.log("info", ...args); }
  warn(...args: unknown[]): void { this.log("warn", ...args); }
  error(...args: unknown[]): void { this.log("error", ...args); }

  child(namespace: string): Logger {
    return new Logger(`${this.prefix}:${namespace}`);
  }
}

export const logger = new Logger();
