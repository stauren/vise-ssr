import {
  ensureDir,
} from './utils/path';

export default async function prepareViseDir(visePath: string) {
  await ensureDir(visePath, true);
}
