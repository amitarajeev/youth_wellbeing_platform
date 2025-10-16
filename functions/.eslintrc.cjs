// functions/.eslintrc.cjs
module.exports = {
  root: true,
  env: { node: true, es2021: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2021, sourceType: 'script' },
  rules: {
    // keep it lenient for Firebase Functions
  },
};
