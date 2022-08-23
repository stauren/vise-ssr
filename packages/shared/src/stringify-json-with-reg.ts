import type { JSONValue } from './index';

/**
 * json对象转json字符串
 * @param { Object } json json对象
 */
export function stringifyJSONWithReg(json: Record<string, JSONValue | RegExp[]> | RegExp[]) {
  return JSON.stringify(json, (k, v) => {
    // 将正则对象转换为字面量形式,由斜杠/包围
    if (v instanceof RegExp) {
      return v.toString();
    }

    return v;
  });
}
