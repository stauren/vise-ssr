import chalk from 'chalk';

class Logger {
  public static info(message: string) {
    Logger.log(chalk.white(Logger.formatViseLog(message)));
  }
  public static error(message: string) {
    Logger.log(chalk.red(Logger.formatViseLog(message)));
  }
  public static warn(message: string) {
    Logger.log(chalk.yellow(Logger.formatViseLog(message)));
  }
  public static success(message: string) {
    Logger.log(chalk.green(Logger.formatViseLog(message)));
  }
  private static formatViseLog(message: string) {
    return `[vise]: ${message}`;
  }
  private static log(message: string) {
    console.log(message);
  }
  constructor() {
    throw new Error('No need to instantiate Logger');
  }
}

export default Logger;
