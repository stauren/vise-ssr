import {
  ensureDir,
} from './utils/path';

export async function prepareViseDir(visePath: string) {
  await ensureDir(visePath, true);
}
