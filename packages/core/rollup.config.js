// @ts-check
import typescript from '@rollup/plugin-typescript';
import executable from 'rollup-plugin-executable';
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dotenv from 'dotenv';
import { visualizer } from 'rollup-plugin-visualizer';
import pkg from './package.json' assert { type: 'json' };

dotenv.config({ path: '../../.env' });
const isDebug = process.env.VISE_DEBUG === 'true';

export default [{
  input: 'src/node/index.ts',
  output: [{
    file: './bin/vise.js',
    sourcemap: isDebug,
    format: 'esm',
    plugins: [...(isDebug ? [] : [terser()])],
  }],
  external: [
    'fs',
    'fs/promises',
    'path',
    'url',
    '@vise-ssr/shared',
    '@vise-ssr/react',
    '@vise-ssr/vue3',
    /node_modules/,
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      declaration: false,
      sourceMap: isDebug,
      exclude: 'template/*',
    }),
    preserveShebangs(),
    executable(),
    visualizer({
      filename: 'vise-bin-stats.html',
      sourcemap: isDebug,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
}, {
  input: 'src/index.ts',
  output: [{
    file: pkg.module,
    sourcemap: isDebug,
    format: 'esm',
    plugins: [...(isDebug ? [] : [terser()])],
  }],
  external: [
    'fs',
    'path',
    'url',
    '@vise-ssr/shared',
    '@vise-ssr/react',
    '@vise-ssr/vue3',
    /node_modules/,
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declarationDir: '.',
      outDir: 'dist',
      sourceMap: isDebug,
    }),
    visualizer({
      filename: 'vise-stats.html',
      sourcemap: isDebug,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
},
];
