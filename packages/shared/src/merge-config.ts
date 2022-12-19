type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
} : T;

type MergeResult = {
  merged: boolean,
  value: unknown,
};

type MergeMethod = (existing: unknown, newValue: unknown) => MergeResult;

const isObject = (value: unknown): value is object => Object.prototype.toString.call(value) === '[object Object]';

const arraify = <T>(target: T | T[]): T[] => (Array.isArray(target) ? target : [target]);

/**
 * mergeWith and pass are used by all merge methods
 * to make sure they produce the same merge result
 */
const mergeWith = (value: unknown): MergeResult => ({ value, merged: true });
const passWith = (value: unknown): MergeResult => ({ value, merged: false });

// if value of neither side is empty, use the other
const simpleMerge: MergeMethod = (existing, newValue) => {
  if (newValue === undefined) return mergeWith(existing);
  if (existing === undefined) return mergeWith(newValue);
  return passWith(existing);
};

/**
 * merge 2 array by concat them together
 * maybe need to support both array & non-array field
 * may need dedupe in the future
 */
const arrayMerge: MergeMethod = (existing, newValue) => (
  (Array.isArray(newValue) || Array.isArray(existing))
    ? mergeWith([...arraify(existing), ...arraify(newValue)])
    : passWith(existing)
);

/**
 * merge 2 array by using new array
 */
const arrayOverwriteMerge: MergeMethod = (existing, newValue) => (
  (Array.isArray(newValue) && Array.isArray(existing))
    ? mergeWith(newValue)
    : passWith(existing)
);

/**
 * if both values are object type, call mergeOneConfig recursively
 */
const objectMerge: MergeMethod = (existing, newValue) => (
  isObject(existing) && isObject(newValue)
    // function mutually call each other scenario
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    ? mergeWith(mergeOneConfig(existing, newValue))
    : passWith(existing)
);

/**
 * if both values are object type, call mergeOneConfig recursively
 */
const objectMergeArrOverwrite: MergeMethod = (existing, newValue) => (
  isObject(existing) && isObject(newValue)
    // function mutually call each other scenario
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    ? mergeWith(mergeOneConfigArrOverwrite(existing, newValue))
    : passWith(existing)
);

/**
 * if 2 values have the same type (but not array and object)
 * use the new value to overwrite the existing one
 */
const sameTypeMerge: MergeMethod = (existing, newValue) => (
  typeof existing === typeof newValue
    ? mergeWith(newValue)
    : passWith(existing)
);

const makeMerge = (methods: MergeMethod[]) => <T extends object>(
  defaults: T,
  override: DeepPartial<T>,
): T => (Object.keys(override) as Array<keyof DeepPartial<T>>)
    .reduce((target, key) => ({
      ...target,
      [key as keyof T]:
          // try all merge methods to merge a property
          methods
            .reduce<MergeResult>(
            (mergeResult, fn) => (mergeResult.merged ? mergeResult : fn(
              target[key as keyof T],
              override[key],
            )),
            passWith(target[key as keyof T]),
          ).value,
    }), defaults);

const MERGE_METHODS = [
  simpleMerge,
  arrayMerge,
  objectMerge,
  sameTypeMerge,
];

const OVERWRITE_ARR_MERGE_METHODS = [
  simpleMerge,
  arrayOverwriteMerge,
  objectMergeArrOverwrite,
  sameTypeMerge,
];

const mergeOneConfig = makeMerge(MERGE_METHODS);

const mergeOneConfigArrOverwrite = makeMerge(OVERWRITE_ARR_MERGE_METHODS);

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

/**
 * some as mergeConfig, but do now merge array
 * using the new array to replace old one
 */
const mergePartial = <T extends object>(
  defaults: T,
  ...overrides: Array<DeepPartial<T>>
): T => overrides.reduce(mergeOneConfigArrOverwrite, defaults);

export {
  mergePartial,
  mergeConfig,
};

export default mergeConfig;
