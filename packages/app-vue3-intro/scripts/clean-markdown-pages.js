#!/usr/bin/env node
import { promises as fsPromise } from 'fs';
import path from 'path';
import { DIR_NAME, SIDEBAR_ITEMS } from './generate-markdown-pages';

function cleanAllPages() {
  SIDEBAR_ITEMS.forEach(({ id, type }) => {
    if (id !== 'introduction' && type !== 'link') {
      fsPromise.unlink(path.resolve(DIR_NAME, `../src/pages/${id}.vue`));
    }
  });
}

cleanAllPages();
