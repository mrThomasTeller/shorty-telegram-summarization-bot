module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  plugins: ['sonarjs', 'unicorn'],
  extends: [
    'standard-with-typescript',
    'prettier',
    'plugin:sonarjs/recommended',
    'plugin:unicorn/recommended',
    'plugin:eslint-comments/recommended',
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['tsconfig.json'],
  },
  rules: {
    // native
    'no-warning-comments': [
      'error',
      {
        terms: ['fixme'],
        location: 'anywhere',
      },
    ],
    'no-console': 'error',
    'no-restricted-syntax': [
      'error',
      { selector: "Identifier[name='logValue']", message: 'log functions are not allowed' },
      { selector: "Identifier[name='logResult']", message: 'log functions are not allowed' },
    ],
    'max-lines': 'error',
    'max-params': ['error', 3],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'always',
      },
    ],
    'n/no-callback-literal': 0,

    // typescript
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_.',
        varsIgnorePattern: '^_.',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
      },
    ],
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: false,
      },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    '@typescript-eslint/promise-function-async': 0,
    '@typescript-eslint/naming-convention': 0,
    '@typescript-eslint/strict-boolean-expressions': ['error', { allowNullableObject: true }],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'array' }],

    // unicorn
    'unicorn/prevent-abbreviations': 0,
    'unicorn/no-useless-undefined': 0,
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          camelCase: true,
          pascalCase: true,
        },
      },
    ],
    'unicorn/no-nested-ternary': 0,
    'unicorn/no-null': 0,
    'unicorn/no-array-reduce': 0,

    // eslint-comments
    'eslint-comments/disable-enable-pair': 0,
    'eslint-comments/no-unused-disable': 'error',

    // sonarjs
    'sonarjs/no-duplicate-string': 0,
  },
};
