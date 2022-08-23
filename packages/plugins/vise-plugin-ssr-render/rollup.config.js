/*
 * @Description:
 * @usage:
 * @FilePath: /vise/packages/plugins/vise-plugin-ssr-render/rollup.config.js
 */
// @ts-check
import typescript from '@rollup/plugin-typescript';

export default [{
  input: 'src/index.ts',
  output: [{
    file: 'dist/index.js',
    sourcemap: true,
    format: 'esm',
  }],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declarationDir: '.',
      outDir: 'dist',
    }),
  ],
}, {
  input: 'src/render-process.ts',
  output: [{
    file: 'dist/render-process.js',
    sourcemap: true,
    format: 'esm',
  }],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declarationDir: '.',
      outDir: 'dist',
    }),
  ],
}];

