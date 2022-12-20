#!/usr/bin/env node
import { promises as fsPromise } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));

const SIDEBAR_ITEMS = JSON.parse(await fsPromise.readFile(
  path.resolve(DIR_NAME, '../src/data/sidebar-items.json'),
  'utf8',
));

async function cleanAllPages() {
  // eslint-disable-next-line no-restricted-syntax
  for (const { id, type } of SIDEBAR_ITEMS) {
    if (id !== 'introduction' && type !== 'link') {
      /* eslint-disable no-await-in-loop */
      await fsPromise.unlink(path.resolve(DIR_NAME, `../src/pages/${id}.vue`));
      await fsPromise.unlink(path.resolve(DIR_NAME, `../src/data/markdown/${id}.md`));
    }
  }
}

cleanAllPages();
