// @ts-check

module.exports = {
  extends: [
    'airbnb/hooks',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    '../../.eslintrc.js',
  ],
  plugins: [
    'react-hooks',
    'react',
  ],
  settings: {
    react: {
      version: '18.2.0',
    },
  },
};
