import type {
  HtmlFixedPositionFragment,
  PlainObject,
  JSONValue,
  JSONArray,
  JSONObject,
  SupportedScaffold,
  HttpHeaders,
  ParsedViseConfig,
} from './client';

export const ScaffoldToPackage = {
  'vue3-app': '@vise-ssr/vue3',
  'react-app': '@vise-ssr/react',
} as const;

export type {
  PlainObject,
  JSONValue,
  JSONArray,
  JSONObject,
  HtmlFixedPositionFragment,
  SupportedScaffold,
  HttpHeaders,
  ParsedViseConfig,
};

export {
  toKebab,
  replaceContentBetweenMarks,
  replacePlaceholderWithValue,
  getPlaceholderOf,
} from './strings';

export {
  getAppRoot,
  getAppVisePath,
} from './path';

export { default as mergeConfig } from './merge-config';

export { stringifyJSONWithReg } from './stringify-json-with-reg';

export { default as injectors } from './document-injector';

export { default as logger } from './logger';

export { viseScaffold } from './vise-scaffold-plugin';

export { fileExist, copyJsonWithChange, copyFileWithChange } from './file-system';
