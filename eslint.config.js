import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["grammar.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        alias: "readonly",
        choice: "readonly",
        field: "readonly",
        grammar: "readonly",
        optional: "readonly",
        prec: "readonly",
        repeat: "readonly",
        repeat1: "readonly",
        seq: "readonly",
        token: "readonly",
      },
    },
    rules: {
      "comma-dangle": ["error", "always-multiline"],
      "no-trailing-spaces": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_$" }],
      quotes: ["error", "single", { allowTemplateLiterals: true }],
      semi: "error",
    },
  },
];
