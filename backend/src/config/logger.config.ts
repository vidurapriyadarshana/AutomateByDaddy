import winston from "winston";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    const stackStr = stack ? `\n${stack}` : "";
    return `[${timestamp}] [${level.toUpperCase().padEnd(7)}] ${message}${metaStr}${stackStr}`;
  }),
);

const consoleTransport = new winston.transports.Console({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.colorize(),
    logFormat,
  ),
});

const fileTransport = new winston.transports.File({
  filename: path.join(LOG_DIR, "app.log"),
  level: "info",
  format: logFormat,
  maxsize: 5242880,
  maxFiles: 5,
});

const errorFileTransport = new winston.transports.File({
  filename: path.join(LOG_DIR, "error.log"),
  level: "error",
  format: logFormat,
  maxsize: 5242880,
  maxFiles: 5,
});

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports: [consoleTransport, fileTransport, errorFileTransport],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, "exceptions.log"),
      format: logFormat,
    }),
  ],
});

export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
