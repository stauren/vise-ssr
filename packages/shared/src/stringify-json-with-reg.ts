import type { JSONValue } from './index';

type JsonWithReg = Record<string, JSONValue | RegExp[]> | RegExp[];
/**
 * json对象转json字符串
 * @param { Object } json json对象
 */
export default function stringifyJSONWithReg(json: JsonWithReg) {
  return JSON.stringify(json, (k, v) => {
    // 将正则对象转换为字面量形式,由斜杠/包围
    if (v instanceof RegExp) {
      return v.toString();
    }

    return v;
  });
}
