// ─── Server Entry Point ────────────────────────────────────────────────────
// Starts the HTTP server with graceful shutdown support.

import app from './app';
import { config } from './config';
import { logger } from './config/logger';
import { APP_NAME, APP_VERSION } from './utils/constants';

// ── Start Server ───────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  logger.info(`
  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │   ${APP_NAME} v${APP_VERSION}                       │
  │                                                 │
  │   Environment : ${config.env.padEnd(15)}            │
  │   Port        : ${String(config.port).padEnd(15)}   │
  │   API         : /api/${config.apiVersion.padEnd(15)}       │
  │                                                 │
  │   Docs        : http://localhost:${config.port}/api/${config.apiVersion}/docs │
  │   Health      : http://localhost:${config.port}/api/${config.apiVersion}/health │
  │   Ping        : http://localhost:${config.port}/api/${config.apiVersion}/ping   │
  │                                                 │
  └─────────────────────────────────────────────────┘
  `);
});

// ── Graceful Shutdown ──────────────────────────────────────────────────────
const gracefulShutdown = (signal: string) => {
  logger.info(`\n🛑 ${signal} received — shutting down gracefully...`);

  server.close(() => {
    logger.info('✅ HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('⚠️  Forced shutdown — connections did not close in time');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Unhandled Rejection / Uncaught Exception ───────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection', { reason });
  // In production, let process manager (PM2) restart the process
  if (config.isProduction) {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default server;
