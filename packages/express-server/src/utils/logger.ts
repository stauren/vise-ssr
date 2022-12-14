import { logger } from '@vise-ssr/shared';

export function log(...args: unknown[]) {
  logger.info(...args);
}

export function error(...args: unknown[]) {
  logger.error(...args);
}
