import { promises as fsPromise } from 'fs';
import path from 'path';
import DIR_NAME from '../dirname';

export default async function getViseVersion() {
  const PKG = await fsPromise.readFile(path.resolve(DIR_NAME, '../package.json'), 'utf8');
  return JSON.parse(PKG).version;
}
