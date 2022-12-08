// @ts-check

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    sourceType: 'module',
    ecmaVersion: 'latest',
    ecmaFeatures: {
      jsx: true,
    },
    extraFileExtensions: ['.cjs', '.mjs', '.tsx'],
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
  ],
  plugins: [
    'react-hooks',
    'react',
    'unicorn',
    'folders',
  ],
  ignorePatterns: [
    // git commit hooks 不读取 .gitignore，这里再配一份…
  ],
  rules: {
    'comma-dangle': 'error',
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
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    react: {
      version: '18.2.0',
    },
  },
};
