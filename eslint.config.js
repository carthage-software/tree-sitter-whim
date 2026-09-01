import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['grammar.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        choice: 'readonly',
        grammar: 'readonly',
        optional: 'readonly',
        repeat: 'readonly',
        seq: 'readonly',
        token: 'readonly',
      },
    },
    rules: {
      'comma-dangle': ['error', 'always-multiline'],
      'no-trailing-spaces': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_$' }],
      quotes: ['error', 'single', { allowTemplateLiterals: true }],
      semi: 'error',
    },
  },
];
