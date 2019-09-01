module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'global-require': 0,
    'no-console': 0,
    'array-callback-return': 0,
    'import/no-dynamic-require': 0,
    'no-underscore-dangle': 0,
    'no-nested-ternary': 0
  },
};
