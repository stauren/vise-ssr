/*
 * @Description:
 * @usage:
 * @FilePath: /vise/packages/plugins/vise-plugin-ssr-render/rollup.config.js
 */
// @ts-check
import dotenv from 'dotenv';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';

dotenv.config({ path: '../../.env' });
const isDebug = process.env.VISE_DEBUG === 'true';

export default [{
  input: 'src/index.ts',
  output: [{
    file: 'dist/index.js',
    sourcemap: isDebug,
    format: 'esm',
    plugins: [...(isDebug ? [] : [terser()])],
  }],
  external: [
    'fs',
    'fs/promises',
    'path',
    'url',
    'chalk',
    /node_modules/,
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declarationDir: '.',
      outDir: 'dist',
      sourceMap: isDebug,
    }),
    visualizer({
      filename: 'stats.html',
      sourcemap: isDebug,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
}, {
  input: 'src/client.ts',
  output: [{
    file: 'dist/client.js',
    sourcemap: isDebug,
    format: 'esm',
    plugins: [...(isDebug ? [] : [terser()])],
  }],
  external: [
    'fs',
    'fs/promises',
    'path',
    'url',
    'chalk',
    /node_modules/,
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declarationDir: '.',
      outDir: 'dist',
      sourceMap: isDebug,
    }),
    visualizer({
      filename: 'stats-client.html',
      sourcemap: isDebug,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
}];

