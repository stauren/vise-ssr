// @ts-check
const a11yOff = Object.keys(require('eslint-plugin-jsx-a11y').rules)
  .reduce((acc, rule) => ({
    ...acc,
    [`jsx-a11y/${rule}`]: 'off',
  }), {});

module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './packages/**/tsconfig.json', './playground/**/tsconfig.json'],
    sourceType: 'module',
    ecmaVersion: 'latest',
    extraFileExtensions: ['.vue'],
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
  ],
  plugins: [
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
    'no-multiple-empty-lines': [
      'error',
      {
        max: 1,
      },
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
    'react/react-in-jsx-scope': 0,
    'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['state'] }],
    ...a11yOff,
    'import/no-named-as-default': 0,
    'arrow-body-style': 0,
  },
  ignorePatterns: [
    'packages/plugins',
  ],
  settings: {
    react: {
      version: '18.2.0',
    },
  },
};
