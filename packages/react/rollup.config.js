// @ts-check
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';
import dotenv from 'dotenv';

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
    'jsdom',
    '@vise-ssr/shared',
    '@vitejs/plugin-react-swc',
    'zx',
    'ora',
    'enquirer',
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
}];

