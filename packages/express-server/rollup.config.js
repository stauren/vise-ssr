import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import executable from 'rollup-plugin-executable';
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';
import terser from '@rollup/plugin-terser';
import dotenv from 'dotenv';
import pkg from './package.json' assert { type: 'json' };

dotenv.config({ path: '../../.env' });

const isDebug = process.env.VISE_DEBUG === 'true';

export default [{
  input: 'src/index.ts',
  external: [
    'fs',
    'path',
    'events',
    'serve-static',
    'express',
    'axios',
    'cors',
    'child_process',
    /node_modules/,
    'vise-ssr',
    '@vise-ssr/shared',
  ],
  output: [{
    file: pkg.module,
    sourcemap: false,
    format: 'esm',
    plugins: [...(isDebug ? [] : [terser()])],
  }],
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: '.',
      esModuleInterop: true,
      outDir: 'dist',
    }),
  ],
}, {
  input: 'src/renderer-subprocess.ts',
  external: [
    'fs',
    'path',
    'events',
    'chalk',
    'vise-ssr',
    '@vise-ssr/shared',
  ],
  output: {
    dir: './dist/',
    sourcemap: false,
    format: 'esm',
    plugins: [...(isDebug ? [] : [terser()])],
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
}, {
  input: 'src/vise-express.ts',
  external: [
    'fs',
    'path',
    'events',
    'vise-ssr',
    '@vise-ssr/shared',
    /node_modules/,
  ],
  output: {
    file: './bin/vise-express.js',
    sourcemap: false,
    format: 'esm',
    plugins: [...(isDebug ? [] : [terser()])],
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: false,
    }),
    preserveShebangs(),
    executable(),
  ],
}];
