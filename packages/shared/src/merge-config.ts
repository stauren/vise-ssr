function isObject(value: unknown): boolean {
  return Object.prototype.toString.call(value) === '[object Object]';
}
// 为了解决 JSONObject 等无穷循环的类型导致报错，这里只支持最多 10 层 deep partial
// Type instantiation is excessively deep and possibly infinite
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial10<T[P]>;
} : T;

type DeepPartial10<T> = T extends object ? { [P in keyof T]?: DeepPartial9<T[P]>; } : T;
type DeepPartial9<T> = T extends object ? { [P in keyof T]?: DeepPartial8<T[P]>; } : T;
type DeepPartial8<T> = T extends object ? { [P in keyof T]?: DeepPartial7<T[P]>; } : T;
type DeepPartial7<T> = T extends object ? { [P in keyof T]?: DeepPartial6<T[P]>; } : T;
type DeepPartial6<T> = T extends object ? { [P in keyof T]?: DeepPartial5<T[P]>; } : T;
type DeepPartial5<T> = T extends object ? { [P in keyof T]?: DeepPartial4<T[P]>; } : T;
type DeepPartial4<T> = T extends object ? { [P in keyof T]?: DeepPartial3<T[P]>; } : T;
type DeepPartial3<T> = T extends object ? { [P in keyof T]?: DeepPartial2<T[P]>; } : T;
type DeepPartial2<T> = T extends object ? Partial<T> : T;
export default function mergeConfig<T>(
  defaults: T,
  ...overrides: Array<DeepPartial<T>>
): T {
  const merged = { ...defaults };

  overrides.forEach((override) => {
    (Object.keys(override as {}) as Array<keyof DeepPartial<T>>).forEach((key) => {
      const value = override[key] as unknown as T[keyof T];

      if (value === undefined) {
        return;
      }

      const existing = merged[key as keyof T];

      if (existing === null || existing === undefined) {
        merged[key as keyof T] = value;
        return;
      }

      if (Array.isArray(value)) {
        if (Array.isArray(existing)) {
          // isArray 添加了 any 属性导致类型转换需要先转 unknown
          const mergedArray = [...existing, ...value] as unknown as T[keyof T];
          merged[key as keyof T] = mergedArray;
        }
        return;
      }

      if (isObject(existing)) {
        if (isObject(value) && value !== null) {
          merged[key as keyof T] = mergeConfig(
            existing,
            value as DeepPartial<T[keyof T]>,
          );
        }
        return;
      }

      if (typeof value === typeof existing) {
        merged[key as keyof T] = value;
      }
    });
  });
  return merged;
}
