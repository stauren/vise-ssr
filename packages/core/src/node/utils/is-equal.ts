import { JSONValue, JSONObject } from '../../';

type ObjType = null | Array<JSONValue> | JSONObject;

function isEqualArray(itemA: JSONValue[], itemB: unknown) {
  if (!(itemB instanceof Array) || itemA.length !== itemB.length) {
    return false;
  }
  return itemA
    .findIndex((value, index) => !isEqual(itemB[index], value)) === -1;
}

function isEqualObject(objA: ObjType, objB: ObjType) {
  // 任一为 null 但另外一个 不是 null
  if (objA === null || objB === null) {
    return false;
  }

  if (objA instanceof Array) {
    return isEqualArray(objA, objB);
  }

  if (objB instanceof Array) {
    return false;
  }

  return isEqualPlainObject(objA, objB);
}

function isEqualPlainObject(objA: JSONObject, objB: JSONObject) {
  if (typeof objB !== 'object') {
    return false;
  }
  if (Object.keys(objA).length !== Object.keys(objB).length) {
    return false;
  }

  return Object
    .keys(objA)
    .findIndex((key: string) => !(key in objB)
      || !isEqual(objA[key], objB[key])) === -1;
}

export default function isEqual(itemA: JSONValue, itemB: JSONValue): boolean {
  // 7 possible type: object, boolean, number, string, bigint, symbol, and undefined
  // no function type in JSONValue

  if (itemA === itemB) {
    return true;
  }
  if (typeof itemA !== typeof itemB) {
    return false;
  }
  // 以上排除了类型不相等 和 value 相等的情况
  // 以下只存在类型相等且 value 不相等的情况
  // boolean, number, string, bigint, undefined 不存在这种场景
  // symbol 也应该只支持直接比较（如果使用者刻意想比较 key，那么应该用 Symbol.for ）
  // 可能的 type 只有 object, 有 null, array 和 plain object 需要处理
  return isEqualObject(itemA as ObjType, itemB as ObjType);
}
