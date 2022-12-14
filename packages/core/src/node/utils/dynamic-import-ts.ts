import fs, { promises as fsPromise } from 'fs';
import path from 'path';
import { build } from 'esbuild';
import esbuildPluginAlias from 'esbuild-plugin-alias';
import { error } from './log';

async function bundleTsFile(fileName: string): Promise<{ code: string; }> {
  const result = await build({
    absWorkingDir: process.cwd(),
    entryPoints: [fileName],
    outfile: 'out.js',
    write: false,
    platform: 'node',
    bundle: true,
    format: 'esm',
    sourcemap: 'inline',
    metafile: true,
    plugins: [
      esbuildPluginAlias({
        '@/': `${path.resolve(path.dirname(fileName), 'src')}/`,
      }),
      {
        name: 'externalize-deps',
        setup(pluginBuild) {
          pluginBuild.onResolve({ filter: /.*/ }, (args) => {
            const id = args.path;
            let res;
            if (id[0] !== '.' && !id.startsWith('@/') && !path.isAbsolute(id)) {
              res = {
                external: true,
              };
            }
            return res;
          });
        },
      },
      {
        name: 'replace-import-meta',
        setup(pluginBuild) {
          pluginBuild.onLoad({ filter: /\.[jt]s$/ }, async (args) => {
            const contents = await fs.promises.readFile(args.path, 'utf8');
            return {
              loader: args.path.endsWith('.ts') ? 'ts' : 'js',
              contents: contents
                .replace(
                  /\bimport\.meta\.url\b/g,
                  JSON.stringify(`file://${args.path}`),
                )
                .replace(
                  /\bimport\.meta\.env\.SSR\b/g,
                  JSON.stringify(true),
                )
                .replace(
                  /\bimport\.meta\.env\b/g,
                  JSON.stringify({}),
                )
                .replace(
                  /\b__dirname\b/g,
                  JSON.stringify(path.dirname(args.path)),
                )
                .replace(/\b__filename\b/g, JSON.stringify(args.path)),
            };
          });
        },
      },
    ],
  });
  const { text } = result.outputFiles[0];
  return {
    code: text,
    // dependencies: result.metafile ? Object.keys(result.metafile.inputs) : [],
  };
}

// const usingDynamicImport = typeof jest === 'undefined';
const usingDynamicImport = true;

/**
 * Dynamically import files. It will make sure it's not being compiled away by TS/Rollup.
 *
 * As a temporary workaround for Jest's lack of stable ESM support, we fallback to require
 * if we're in a Jest environment.
 * See https://github.com/vitejs/vite/pull/5197#issuecomment-938054077
 *
 * @param file File path to import.
 */
const dynamicImport = usingDynamicImport
  // use eval on purpose
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  ? new Function('file', 'return import(file)')
  : require;

export default async function dynamicImportTs<T>(filePath: string): Promise<T | undefined> {
  let result: T | undefined;
  try {
    await fsPromise.access(filePath, fs.constants.F_OK);

    // bundle the config file w/ ts transforms first, write it to disk,
    // load it with native Node ESM, then delete the file.
    const bundled = await bundleTsFile(filePath);
    const tempConfigPath = `${filePath}.js`;
    await fsPromise.writeFile(tempConfigPath, bundled.code);
    result = (await dynamicImport(`${tempConfigPath}?t=${Date.now()}`)).default;
    await fsPromise.unlink(tempConfigPath);
  } catch (err) {
    error('[dynamicImportTs error]', err);
  }

  return result;
}
