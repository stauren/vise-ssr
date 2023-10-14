import path from 'node:path';

// 获取 app 根路径，即当前 process 启动路径，vise 命令需要在 app 根目录执行
export function getAppRoot() {
  return process.env.PWD!;
}

// 获取当前 app 的 vise 缓存目录，位于 app/node_modules/.vise
export function getAppVisePath({
  root = getAppRoot(),
  isUrlPath = false,
} = {}) {
  const rootDirName = '.vise';
  return isUrlPath
    ? path.join('/node_modules', rootDirName)
    : path.join(root, 'node_modules', rootDirName);
}
