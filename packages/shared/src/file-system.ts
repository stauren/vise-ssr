import { promises as fs } from 'fs';
import logger from './logger';

/**
 * 判断文件是否存在
 * @param path 文件路径
 * @returns boolean 存在-true， 不存在-false
 */
export async function fileExist(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

type ChangeDetail = {
  author: string,
  description: string,
  name: string,
  dependencies: Record<string, string>,
};

type IPkgJson = {
  dependencies: Record<string, string>,
};

export async function copyJsonWithChange(src: string, target: string, changes: ChangeDetail) {
  let data: IPkgJson;
  try {
    data = JSON.parse(await fs.readFile(src, 'utf-8')) as IPkgJson;
  } catch (e) {
    logger.error(`读取 ${src} 失败`);
    throw e;
  }
  const newData = { ...data, ...changes, dependencies: { ...data.dependencies, ...changes.dependencies } };
  await fs.writeFile(target, JSON.stringify(newData, null, 2));
}
