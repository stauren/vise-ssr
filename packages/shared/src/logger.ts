import chalk from 'chalk';

class Logger {
  public static info(message: string) {
    console.log(chalk.white(Logger.formatViseLog(message)));
  }
  public static error(message: string) {
    console.log(chalk.red(Logger.formatViseLog(message)));
  }
  public static warn(message: string) {
    console.log(chalk.yellow(Logger.formatViseLog(message)));
  }
  public static success(message: string) {
    console.log(chalk.green(Logger.formatViseLog(message)));
  }
  private static formatViseLog(message: string) {
    return `[vise]: ${message}`;
  }
  constructor() {
    throw new Error('不需要实例化 Logger');
  }
}

export default Logger;
