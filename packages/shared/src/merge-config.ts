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
    (Object.keys(override) as Array<keyof T>).forEach((key) => {
      const value = override[key];

      if (value === undefined) {
        return;
      }

      const existing = merged[key];

      if (existing === null || existing === undefined) {
        merged[key] = value as T[keyof T];
        return;
      }

      if (Array.isArray(value)) {
        if (Array.isArray(existing)) {
          // ts 识别不出来这个转换，是因为 Array.isArray 的 type guard
          // 给 value 增添了新的类型：arg is any[]，使用 unknown 转换
          merged[key] = [...existing, ...value] as unknown as T[keyof T];
        }
        return;
      }

      if (isObject(existing)) {
        if (isObject(value)) {
          merged[key] = mergeConfig(
            existing,
            // 此处有个看起来比较愚蠢的不能识别的 Partial 类型匹配…
            // Argument of type 'DeepPartial<T>[keyof T]' is not
            // assignable to parameter of type 'DeepPartial<T[keyof T]>'
            value as unknown as DeepPartial<T[keyof T]>,
          );
        }
        return;
      }

      if (typeof value === typeof existing) {
        merged[key] = value as T[keyof T];
      }
    });
  });
  return merged;
}
