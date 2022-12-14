import { logger } from '@vise-ssr/shared';

export function log(...args: any) {
  logger.info(...args);
}

export function error(...args: any) {
  logger.error(...args);
}
