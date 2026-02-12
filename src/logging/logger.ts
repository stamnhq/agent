import pino from 'pino';
import type { AgentConfig } from '../config/config-schema.js';

export function createLogger(
  config: Pick<AgentConfig, 'logLevel'>,
): pino.Logger {
  const isDev = process.env.NODE_ENV !== 'production';

  return pino({
    level: config.logLevel,
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
        }
      : undefined,
  });
}
