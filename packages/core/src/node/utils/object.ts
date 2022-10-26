import type { JSONObject, JSONValue } from '../../';

/**
 * 判断是否纯对象
 *
 * @export
 * @param {*} obj
 * @return {*}  {boolean}
 */
export function isPureObject(obj: any): boolean {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

export const cloneDeep = (function () {
  let seen: Array<[JSONObject, JSONObject]> = [];
  function cloneDeepInner(source: JSONValue): JSONValue {
    if (source === null || typeof source !== 'object') {
      // Primitive value: bigint, boolean, null, number, string, symbol, undefined
      return source;
    }

    if (Array.isArray(source)) {
      return source.map(cloneDeep);
    }

    // 到这里只能是 JSONObject 了
    // fix infinite loop caused by circular reference
    const alreadyCloned = seen.find(v => v[0] === source)?.[1];
    if (alreadyCloned) {
      return alreadyCloned;
    }
    const cloned = {};
    seen.push([source, cloned]);

    return Object.keys(source).reduce((previousValue, key) => {
      // 这里就是刻意要改变入参对象
      // @ts-ignore
      // eslint-disable-next-line no-param-reassign
      previousValue[key] = cloneDeep(source[key]);
      return previousValue;
    }, cloned);
  }

  return function (source: JSONValue): JSONValue {
    seen = [];
    return cloneDeepInner(source);
  };
}());
