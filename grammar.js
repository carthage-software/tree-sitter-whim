/**
 * @file Tree-sitter grammar for Whim
 * @author Seifeddine Gmati <azjezz@carthage.software>
 * @license MIT OR Apache-2.0
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const KEYWORDS = [
  'abstract',
  'array',
  'as',
  'bool',
  'break',
  'case',
  'catch',
  'class',
  'classname',
  'const',
  'continue',
  'default',
  'dict',
  'do',
  'else',
  'enum',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'fn',
  'for',
  'foreach',
  'function',
  'if',
  'implements',
  'in',
  'int',
  'interface',
  'is',
  'match',
  'mixed',
  'namespace',
  'never',
  'new',
  'newtype',
  'null',
  'object',
  'out',
  'parent',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'self',
  'static',
  'string',
  'throw',
  'true',
  'try',
  'type',
  'use',
  'using',
  'vec',
  'void',
  'while',
];

const IDENTIFIER = /[A-Za-z_\u0080-\uFFFF][A-Za-z0-9_\u0080-\uFFFF]*/;

export default grammar({
  name: 'whim',

  extras: _ => [],

  rules: {
    source_file: $ => repeat(choice($.keyword, $._text)),

    keyword: _ => choice(...KEYWORDS),

    _text: _ => token(choice(
      seq('#!', /[^\n]*/),
      seq('//', /[^\n]*/),
      seq('/*', repeat(choice(/[^*]/, seq('*', /[^/]/))), optional('*/')),
      seq('\'', repeat(choice(/[^'\\]/, seq('\\', /./))), optional('\'')),
      seq('"', repeat(choice(/[^"\\]/, seq('\\', /./))), optional('"')),
      seq('$', IDENTIFIER),
      IDENTIFIER,
      /[^A-Za-z_\u0080-\uFFFF$'"/#]+/,
      /[$'"/#]/,
    )),
  },
});
