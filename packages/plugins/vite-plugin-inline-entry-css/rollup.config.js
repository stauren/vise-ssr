// @ts-check
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: [{
    file: pkg.module,
    exports: 'default',
    sourcemap: true,
    format: 'esm',
  }, {
    file: pkg.main,
    sourcemap: true,
    exports: 'default',
    format: 'cjs',
  }],
  external: [
    /node_modules/,
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declarationDir: '.',
      outDir: 'dist',
    }),
  ],
};

