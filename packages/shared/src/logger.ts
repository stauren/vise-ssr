import chalk from 'chalk';
import type { ChalkInstance } from 'chalk';

class Logger {
  public static info(...messages: unknown[]) {
    Logger.log(chalk.white, ...messages);
  }

  public static warn(...messages: unknown[]) {
    Logger.log(chalk.yellow, ...messages);
  }

  public static success(...messages: unknown[]) {
    Logger.log(chalk.green, ...messages);
  }

  public static error(...messages: unknown[]) {
    Logger.err(...messages
      .map((o) => (typeof o === 'string' ? chalk.red(o) : o)));
  }

  private static log(chalkColor: ChalkInstance, ...messages: unknown[]) {
    // eslint-disable-next-line no-console
    console.log(
      '[vise]',
      ...messages.map((o) => (typeof o === 'string' ? chalkColor(o) : o)),
    );
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
