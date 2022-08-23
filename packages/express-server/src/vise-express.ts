#!/usr/bin/env node

import path from 'path';
import { Command } from 'commander';
import { $ } from 'zx';

import { DIR_NAME } from '@/utils/env';
import startServer from './start-server';

export type StartOption = {
  enableCache: 'true' | 'false',
  bundleDir: true | undefined,
  repeatRender: string,
  port?: string,
};

async function initCommander(argv: string[]) {
  $.verbose = false;
  const program = new Command();
  const rawPkgJson = await $`cat ${path.resolve(DIR_NAME, '../package.json')}`;
  const { version } = JSON.parse(rawPkgJson.stdout);
  program.version(version);

  program
    .command('start')
    .argument('viseAppDir')
    .description('start http listen')
    .option('-p, --port <port>', 'server listen port')
    .option('-b, --bundle-dir', 'serve from bundle dir instead of vise app dir')
    .option('-c, --enable-cache <trueOrFalse>', 'enable server cache', 'true')
    .option('-r, --repeat-render <times>', 'repeat ssr for benchmark test', '0')
    .action((base: string, options: StartOption) => {
      startServer(base, {
        ...options,
        repeatRender: options.repeatRender ? parseInt(options.repeatRender, 10) : 0,
        enableCache: options.enableCache === 'true',
      });
    });
  program.parse(argv);
}

initCommander(process.argv);
