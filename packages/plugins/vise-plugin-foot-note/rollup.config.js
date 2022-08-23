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
}];

