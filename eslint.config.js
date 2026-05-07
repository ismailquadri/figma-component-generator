module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**', 'handoff-package/**']
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        node: true,
        jest: true,
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always']
    }
  }
];