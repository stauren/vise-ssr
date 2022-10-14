#!/usr/bin/env node

import { $ } from 'zx';
import 'zx/globals';

const mainPackageJson = './packages/core/package.json';
const majorPackageJsons = [
  './packages/vue3/package.json',
  './packages/react/package.json',
  './packages/shared/package.json',
  './packages/express-server/package.json',
];
const packagesDependCore = [
  './packages/core/package.json',
  './packages/vue3/package.json',
  './packages/react/package.json',
  './packages/shared/package.json',
  './packages/vue3/template/base/package.json',
  './packages/react/template/base/package.json',
  './packages/plugins/vise-plugin-render-error/package.json',
  './packages/plugins/vise-plugin-half-ssr/package.json',
  './packages/plugins/vise-plugin-foot-note/package.json',
  './packages/plugins/vise-plugin-ssr-render/package.json',
  './packages/express-server/package.json',
  './packages/app-vue3-intro/package.json',
  './packages/app-react-intro/package.json',
];

async function getCoreVersion() {
  const json = await fs.readFile(mainPackageJson, 'utf8');
  return JSON.parse(json).version;
}

async function replaceDepsVersion(version) {
  await $`sed -i '' -E 's/("vise-ssr": ")[0-9^.]+"/\\1${version}"/' ${packagesDependCore}`;
  await $`sed -i '' -E 's/("@vise-ssr\\/shared": ")[0-9^.]+"/\\1${version}"/' ${packagesDependCore}`;
  await $`sed -i '' -E 's/("@vise-ssr\\/vue3": ")[0-9^.]+"/\\1${version}"/' ${packagesDependCore}`;
  await $`sed -i '' -E 's/("@vise-ssr\\/react": ")[0-9^.]+"/\\1${version}"/' ${packagesDependCore}`;
  await $`sed -i '' -E 's/("@vise-ssr\\/express-server": ")[0-9^.]+"/\\1${version}"/' ${packagesDependCore}`;
}

async function replaceMajorPackageVersion(version) {
  await $`sed -i '' -E 's/("version": ")[0-9^.]+"/\\1${version}"/' ${majorPackageJsons}`;
}

async function main() {
  $.verbose = false;
  const version = await getCoreVersion();
  await replaceDepsVersion(version);
  await replaceMajorPackageVersion(version);
  console.log('version synced.');
}

main();
