module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '*.js',
    '!cli.js',
    '!node_modules/**',
    '!coverage/**',
    '!tests/**',
    '!handoff-package/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true
};