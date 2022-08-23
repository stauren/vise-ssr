// @ts-check

module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './packages/**/tsconfig.json'],
    sourceType: 'module',
    ecmaVersion: 'latest',
    extraFileExtensions: ['.vue', '.cjs', '.mjs'],
  },
  extends: [
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:vue/vue3-recommended',
    'eslint-config-tencent',
    'eslint-config-tencent/ts',
  ],
  plugins: [
    'react-hooks',
    'react',
    'vue',
    'unicorn',
    'folders',
  ],
  ignorePatterns: [
    // git commit hooks 不读取 .gitignore，这里再配一份…
    'packages/react/template',
    'packages/vue3/template',
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
  },
  overrides: [{
    files: ['packages/**/*.vue'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  }],
  settings: {
    react: {
      version: '18.2.0',
    },
  },
};
