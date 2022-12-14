type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
} : T;

type MergeResult = {
  merged: boolean,
  value: unknown,
};

const isObject = (value: unknown): value is object => Object.prototype.toString.call(value) === '[object Object]';

const arraify = <T>(target: T | T[]): T[] => (Array.isArray(target) ? target : [target]);

/**
 * mergeWith and pass are used by all merge methods
 * to make sure they produce the same merge result
 */
const mergeWith = (value: unknown): MergeResult => ({ value, merged: true });
const passWith = (value: unknown): MergeResult => ({ value, merged: false });

// if value of neither side is empty, use the other
const simpleMerge = (existing: unknown, newValue: unknown): MergeResult => {
  if (newValue === undefined) return mergeWith(existing);
  if (existing === undefined) return mergeWith(newValue);
  return passWith(existing);
};

/**
 * merge 2 array by concat them together
 * maybe need to support both array & non-array field
 * may need dedupe in the future
 */
const arrayMerge = (existing: unknown, newValue: unknown): MergeResult => (
  (Array.isArray(newValue) || Array.isArray(existing))
    ? mergeWith([...arraify(existing), ...arraify(newValue)])
    : passWith(existing)
);

/**
 * if both values are object type, call mergeOneConfig recursively
 */
const objectMerge = (existing: unknown, newValue: unknown): MergeResult => (
  isObject(existing) && isObject(newValue)
    // function mutually call each other scenario
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    ? mergeWith(mergeOneConfig(existing, newValue))
    : passWith(existing)
);

/**
 * if 2 values have the same type (but not array and object)
 * use the new value to overwrite the existing one
 */
const sameTypeMerge = (existing: unknown, newValue: unknown): MergeResult => (
  typeof existing === typeof newValue
    ? mergeWith(newValue)
    : passWith(existing)
);

const MERGE_METHODS = [simpleMerge, arrayMerge, objectMerge, sameTypeMerge];

const mergeOneConfig = <T extends object>(
  defaults: T,
  override: DeepPartial<T>,
): T => (Object.keys(override) as Array<keyof DeepPartial<T>>)
    .reduce((target, key) => ({
      ...target,
      [key as keyof T]:
          // try all merge methods to merge a property
          MERGE_METHODS
            .reduce<MergeResult>(
            (mergeResult, fn) => (mergeResult.merged ? mergeResult : fn(
              target[key as keyof T],
              override[key],
            )),
            passWith(target[key as keyof T]),
          ).value,
    }), defaults);

/**
 * merge a config object with config fragments which are
 * usually partial modifications introduced by a user or
 * a plugin who only care about their own aspect
 * multiple overrides object accepted
 */
const mergeConfig = <T extends object>(
  defaults: T,
  ...overrides: Array<DeepPartial<T>>
): T => overrides.reduce(mergeOneConfig, defaults);

export default mergeConfig;
