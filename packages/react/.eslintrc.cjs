// @ts-check

module.exports = {
  extends: [
    '../../.eslintrc.js',
  ],
  ignorePatterns: [
    // git commit hooks 不读取 .gitignore，这里再配一份…
    'template',
  ],
};
