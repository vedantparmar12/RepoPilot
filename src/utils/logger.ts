import pino from 'pino';
import { createWriteStream } from 'fs';
import { join } from 'path';

// For MCP servers, we must NOT log to stdout/stderr as it interferes with stdio transport
// Instead, log to a file or disable logging entirely in production
const isProduction = process.env.NODE_ENV === 'production' || !process.env.LOG_LEVEL || process.env.LOG_LEVEL === 'silent';

const logFile = join(process.cwd(), 'mcp-server.log');

export const logger = isProduction ? 
  // Silent logger for production (MCP mode)
  pino({ level: 'silent' }) :
  // File logger for development/debugging
  pino({
    level: process.env.LOG_LEVEL || 'info',
    serializers: {
      error: pino.stdSerializers.err
    }
  }, createWriteStream(logFile, { flags: 'a' }));

export function createLogger(name: string) {
  return logger.child({ component: name });
}