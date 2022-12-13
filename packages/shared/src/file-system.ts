import { promises as fs } from 'fs';
import logger from './logger';
import { replacePlaceholderWithValue } from './strings';

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
}

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
  const newData = {
    ...data,
    ...changes,
    dependencies: { ...data.dependencies, ...changes.dependencies },
  };
  return fs.writeFile(target, JSON.stringify(newData, null, 2));
}

export async function copyFileWithChange(
  src: string,
  destination: string,
  changed: Record<string, string>,
) {
  let source: string;
  try {
    source = await fs.readFile(src, 'utf-8');
  } catch (e) {
    logger.error(`读取 ${src} 失败`);
    throw e;
  }
  const result = Object.keys(changed).reduce(
    (content: string, replaceKey) => replacePlaceholderWithValue(
      content,
      replaceKey,
      changed[replaceKey],
    ),
    source,
  );
  return fs.writeFile(destination, result, 'utf-8');
}
