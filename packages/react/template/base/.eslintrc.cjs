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
    extraFileExtensions: [],
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
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
          tsx: 'never',
          md: 'always',
          scss: 'always',
          'd.ts': 'never',
        },
      },
    ],
    'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['state'] }],
  },
  settings: {
    react: {
      version: '18.2.0',
    },
  },
};
