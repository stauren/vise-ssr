import chalk from 'chalk';
import type { ChalkInstance } from 'chalk';

class Logger {
  public static info(...messages: unknown[]) {
    Logger.log(chalk.white, ...messages);
  }

  public static error(...messages: unknown[]) {
    Logger.err(...messages.map(chalk.red));
  }

  public static warn(...messages: unknown[]) {
    Logger.log(chalk.yellow, ...messages);
  }

  public static success(...messages: unknown[]) {
    Logger.log(chalk.green, ...messages);
  }

  static log(chalkColor: ChalkInstance, ...messages: unknown[]) {
    // eslint-disable-next-line no-console
    console.log('[vise]', ...messages.map((o) => chalkColor(o)));
  }

  private static err(...messages: unknown[]) {
    // eslint-disable-next-line no-console
    console.error('[vise]', ...messages);
  }

  constructor() {
    throw new Error('No need to instantiate Logger');
  }
}

export default Logger;
