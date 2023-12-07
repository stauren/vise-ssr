// @ts-check

module.exports = {
  extends: [
    'plugin:vue/vue3-recommended',
    '../../.eslintrc.js',
  ],
  plugins: [
    'vue',
  ],
  overrides: [
    {
      files: ['src/pages/*.vue'],
      rules: {
        'vue/multi-word-component-names': 0,
      },
    },
  ],
};
