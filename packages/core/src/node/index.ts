#!/usr/bin/env node

import { Command } from 'commander';
import buildProject from './build';
import { createNewApp } from './create';
import serveProject from './serve';
import createServer from './dev-server';
import getAppViseConfig from './app-config';
import { getViseVersion } from './utils/env';

async function init() {
  const program = new Command();
  const DEFAULT_PORT = 3000;

  program
    .name('vise')
    .description('Vise is a SSR framework for website. More info: https://stauren.github.io/vise-ssr/')
    .version(await getViseVersion());

  program
    .command('build')
    .description('build vise project for production')
    .action(() => {
      buildProject();
    });

  program
    .command('dev')
    .description('launch dev web server')
    .option('-p,--port <port_number>', 'web port')
    .action(async (options) => {
      const config = await getAppViseConfig();
      const port = (options.port ? Number(options.port) : config.devPort) ?? DEFAULT_PORT;

      const server = createServer(config.scaffold, port);
      server.start();
    });

  program
    .command('create')
    .description('create new app')
    .action(() => {
      createNewApp();
    });

  program
    .command('serve')
    .description('start SSR HTTP server with built vise app dir or vise project bundles')
    .argument('[viseAppDir]')
    .option('-p, --port <port>', 'server listen port', String(DEFAULT_PORT))
    .option('-c, --enable-cache <trueOrFalse>', 'enable server cache', 'true')
    .option('-r, --repeat-render <times>', 'repeat ssr for benchmark test', '0')
    .action((viseAppDir, options) => {
      serveProject(viseAppDir, options);
    });

  program.parse(process.argv);
}

init();
