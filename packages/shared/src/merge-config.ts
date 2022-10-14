type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]>: T[P];
} : T;

type MergeResult = {
  merged: true,
  // 合并结果可以包含任何类型的值，这里要更严谨可以用泛型
  value: any,
} | { merged: false };

const isObject = (value: unknown): value is object => value !== null
  && Object.prototype.toString.call(value) === '[object Object]';

const mergeWith = (value: any): MergeResult => ({
  merged: true,
  value,
});

const pass = (): MergeResult => ({ merged: false });

const simpleMerge = (existing: unknown, newValue: unknown): MergeResult => {
  if (newValue === undefined) return mergeWith(existing);
  if (existing === null || existing === undefined) return mergeWith(newValue);
  return pass();
};

// array merge 只关注是否参数是 2 个 array，具体类型不关心
const arrayMerge = (existing: unknown, newValue: unknown): MergeResult => (
  (!Array.isArray(newValue) || !Array.isArray(existing))
    ? pass()
    : mergeWith([...existing, ...newValue])
);

// 如果 2个值都是 object，则递归调用 mergeConfig
const objectMerge = (existing: unknown, newValue: unknown): MergeResult => (
  (!isObject(existing) || !isObject(newValue))
    ? pass()
    : mergeWith(mergeConfig(existing, newValue))
);

// 如果 2 个值类型相同，直接覆盖
const sameTypeMerge = (
  existing: unknown,
  newValue: unknown,
): MergeResult => (
  typeof existing === typeof newValue ? mergeWith(newValue) : pass()
);

const useMergedValueOrExisting = (
  mergeResult: MergeResult,
  existing: unknown,
) => (mergeResult.merged ? mergeResult.value : existing);

const MERGE_METHODS = [simpleMerge, arrayMerge, objectMerge, sameTypeMerge];

const tryAllMergeMethods = (
  existing: unknown,
  newValue: unknown,
): MergeResult => MERGE_METHODS.reduce<MergeResult>((mergeResult, fn) => {
  if (mergeResult.merged) return mergeResult;
  return fn(existing, newValue);
}, { merged: false });

const mergeOneConfig = <T extends object>(
  defaults: T,
  override: DeepPartial<T>,
): T => (Object.keys(override) as Array<keyof DeepPartial<T>>)
    .reduce((target, key) => ({
      ...target,
      [key as keyof T]:
        useMergedValueOrExisting(
          tryAllMergeMethods(target[key as keyof T], override[key]),
          target[key as keyof T],
        ),
    }), defaults);

const mergeConfig = <T extends object>(
  defaults: T,
  ...overrides: Array<DeepPartial<T>>
): T => overrides.reduce(mergeOneConfig, defaults);

export default mergeConfig;
