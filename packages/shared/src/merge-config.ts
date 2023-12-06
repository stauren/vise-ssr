type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
} : T;

type MergeResult = {
  merged: boolean,
  value: unknown,
};

type MergeMethod = (existing: unknown, newValue: unknown, option: MergeOption) => MergeResult;

type MergeOption = {
  array: 'concat' | 'newer',
  allowDupeInArray: boolean,
  allowEmptyInArray: boolean,
  emptyValue: 'prefer_newer' | 'prefer_valid', // empty means undefined or null
  strictTypeMatch: boolean,
};

const DEFAULT_MERGE_OPTION: MergeOption = {
  array: 'concat',
  emptyValue: 'prefer_newer',
  allowDupeInArray: false,
  allowEmptyInArray: false,
  strictTypeMatch: false,
};

const isObject = (value: unknown): value is object => Object.prototype.toString.call(value) === '[object Object]';

const arraify = <T>(target: T | T[]): T[] => (Array.isArray(target) ? target : [target]);

const isEmpty = (obj: unknown) => obj === undefined || obj === null;

/**
 * mergeWith and pass are used by all merge methods
 * to make sure they produce the same merge result
 */
const mergeWith = (value: unknown): MergeResult => ({ value, merged: true });
const passWith = (value: unknown): MergeResult => ({ value, merged: false });

// at least one of the value is empty
const emptyMerge: MergeMethod = (existing, newValue, option) => {
  if (isEmpty(newValue) || isEmpty(existing)) {
    if (option.emptyValue === 'prefer_newer') {
      return mergeWith(newValue);
    }
    if (isEmpty(newValue)) return mergeWith(existing);
    if (isEmpty(existing)) return mergeWith(newValue);
  }
  return passWith(existing);
};

const filterArray = (array: unknown[], option: MergeOption) => {
  let result = array;
  if (!option.allowDupeInArray) {
    result = [...new Set(array)];
  }
  if (!option.allowEmptyInArray) {
    result = result.filter((o) => !isEmpty(o));
  }
  return result;
};

/**
 * one of the value is an array
 * 1. only one is an array, put the other into the array if it's not empty
 * 2. both are arrays, concat or use newer
 */
const arrayMerge: MergeMethod = (existing, newValue, option) => {
  const existingIsArray = Array.isArray(existing);
  const newValueIsArray = Array.isArray(newValue);
  if (existingIsArray || newValueIsArray) {
    if (existingIsArray && newValueIsArray) {
      if (option.array === 'newer') return mergeWith(filterArray(newValue, option));
    }
    return mergeWith(filterArray([...arraify(existing), ...arraify(newValue)], option));
  }
  return passWith(existing);
};

/**
 * in strict mode
 * if 2 values have the same type (but not array and object)
 * use the new value to overwrite the existing one
 * in non-strict mode: always use the newer value
 */
const primitiveMerge: MergeMethod = (existing, newValue, { strictTypeMatch }) => {
  if (strictTypeMatch) {
    if (typeof existing === typeof newValue) return mergeWith(newValue);
    return passWith(existing);
  }
  return mergeWith(newValue);
};

const makeMergerWithMergeMethods = (
  methods: MergeMethod[],
  options: MergeOption,
) => <T extends object>(
  defaults: T,
  override: DeepPartial<T>,
): T => (Object.keys(override) as Array<keyof DeepPartial<T>>)
    .reduce((result, key) => ({
      ...result,
      [key as keyof T]:
          // try all merge methods to merge a property
          methods
            .reduce<MergeResult>(
            (mergeResult, fn) => (mergeResult.merged ? mergeResult : fn(
              result[key as keyof T],
              override[key],
              options,
            )),
            passWith(result[key as keyof T]),
          ).value,
    }), defaults);

const getMerger = (options: Partial<MergeOption> = {}) => {
  const optionsWithDefault: MergeOption = { ...DEFAULT_MERGE_OPTION, ...options };
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

  const mergeMethods = [
    emptyMerge,
    arrayMerge,
    objectMerge,
    primitiveMerge,
  ];

  const mergeOneConfig = makeMergerWithMergeMethods(mergeMethods, optionsWithDefault);

  return <T extends object>(
    defaults: T,
    ...overrides: Array<DeepPartial<T>>
  ): T => overrides.reduce(mergeOneConfig, defaults);
};

/**
 * merge a config object with config fragments which are
 * usually partial modifications introduced by a user or
 * a plugin who only care about their own aspect
 * multiple overrides object accepted
 */
const mergeConfig = getMerger();

const mergePartial = getMerger({ array: 'newer' });

export {
  getMerger,
  mergeConfig,
  mergePartial,
};

export default mergeConfig;
