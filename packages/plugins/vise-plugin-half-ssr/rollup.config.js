// @ts-check
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';

export default [{
  input: 'src/index.ts',
  output: [{
    file: pkg.module,
    sourcemap: true,
    format: 'esm',
  }, {
    file: pkg.main,
    sourcemap: true,
    format: 'cjs',
  }],
  plugins: [
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declarationDir: '.',
      outDir: 'dist',
    }),
  ],
}];
