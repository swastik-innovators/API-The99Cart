// ─── Winston Logger ────────────────────────────────────────────────────────
// Structured, production-ready logging with file rotation.

import winston from 'winston';
import path from 'path';
import { config } from './index';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Log directory ──────────────────────────────────────────────────────────
const LOG_DIR = path.resolve(process.cwd(), 'logs');

// ── Custom format for development ──────────────────────────────────────────
const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n  ${JSON.stringify(meta, null, 2)}` : '';
  return `${ts} [${level}]: ${stack || message}${metaStr}`;
});

// ── Transports ─────────────────────────────────────────────────────────────
const transports: winston.transport[] = [];

if (config.isProduction) {
  // In production, log only to console. Vercel capturing stdout/stderr automatically.
  transports.push(
    new winston.transports.Console({
      level: config.log.level,
      format: combine(json()),
    })
  );
} else {
  // In development, log to files and console
  transports.push(
    new winston.transports.Console({
      format: combine(colorize({ all: true }), devFormat),
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5_242_880, // 5 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10_485_760, // 10 MB
      maxFiles: 10,
    })
  );
}

// ── Logger Instance ────────────────────────────────────────────────────────
export const logger = winston.createLogger({
  level: config.log.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'the99cart-api' },
  transports,
  exitOnError: false,
});

// ── Stream for Morgan (if needed later) ────────────────────────────────────
export const logStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
