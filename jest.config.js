module.exports = {
  verbose: true,
  transform: {
    '.(ts|tsx)': 'ts-jest',
  },
  testRegex: '(/spec/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {
    '^Components/(.*)': './src/components/$1',
  },
  globals: {
    window: {},
    'ts-jest': {
      tsConfig: './tsconfig.json',
    },
  },
  setupFiles: ['./jest.stubs.js'],
  setupFilesAfterEnv: ['./jest.tests.ts'],
};
