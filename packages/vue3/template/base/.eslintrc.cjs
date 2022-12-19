// @ts-check
const path = require('path');

module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    sourceType: 'module',
    ecmaVersion: 'latest',
    extraFileExtensions: ['.vue'],
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'plugin:vue/vue3-recommended',
  ],
  plugins: [
    'vue',
    'unicorn',
    'folders',
  ],
  rules: {
    // it won't be fixed when using --fix flag
    'unicorn/filename-case': [
      'warn',
      {
        case: 'kebabCase',
      },
    ],
    'folders/match-regex': [
      'error',
      '^([a-z]+(-[a-z0-9]+)*)|(__tests?__)$',
      path.resolve(__dirname, './src'),
    ],
    'no-throw-literal': 0,
    '@typescript-eslint/no-throw-literal': 0,
    'import/no-unresolved': 0,
    'import/extensions': [
      'error',
      'never',
      {
        pattern: {
          json: 'always',
          vue: 'always',
          md: 'always',
          scss: 'always',
          tsx: 'never',
          'd.ts': 'never',
        },
      },
    ],
    'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['state'] }],
    'vue/multi-word-component-names': ['error', {
      ignores: ['index'],
    }],
  },
};
