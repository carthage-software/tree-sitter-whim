#include "tree_sitter/parser.h"

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

enum TokenType {
  IDENTIFIER_TOKEN,
  NAME_SEGMENT_CONTINUING_TOKEN,
  NAMESPACE_NAME_SEGMENT_CONTINUING_TOKEN,
  NAME_SEPARATOR,
  FLOAT_LITERAL_TOKEN,
  SINGLE_QUOTED_ESCAPE_SEQUENCE,
  DOUBLE_QUOTED_ESCAPE_SEQUENCE,
  DOUBLE_QUOTED_DOLLAR,
};

static bool is_identifier_start(int32_t character) {
  return character == '_' || (character >= 'A' && character <= 'Z') ||
         (character >= 'a' && character <= 'z') || character >= 0x80;
}

static bool is_identifier_part(int32_t character) {
  return is_identifier_start(character) ||
         (character >= '0' && character <= '9');
}

static bool is_decimal_digit(int32_t character) {
  return character >= '0' && character <= '9';
}

static bool is_octal_digit(int32_t character) {
  return character >= '0' && character <= '7';
}

static bool is_hexadecimal_digit(int32_t character) {
  return is_decimal_digit(character) ||
         (character >= 'A' && character <= 'F') ||
         (character >= 'a' && character <= 'f');
}

static bool is_whitespace(int32_t character) {
  return character == ' ' || character == '\t' || character == '\n' ||
         character == '\r' || character == '\v' || character == '\f';
}

#define WORD(value)                                                            \
  (length == sizeof(value) - 1 && memcmp(text, value, sizeof(value) - 1) == 0)

static bool is_reserved_identifier(const char *text, size_t length) {
  return WORD("_") || WORD("abstract") || WORD("array") || WORD("as") ||
         WORD("bool") || WORD("break") || WORD("case") || WORD("catch") ||
         WORD("class") || WORD("classname") || WORD("const") ||
         WORD("continue") || WORD("default") || WORD("dict") || WORD("do") ||
         WORD("else") || WORD("enum") || WORD("extends") || WORD("false") ||
         WORD("final") || WORD("finally") || WORD("float") || WORD("fn") ||
         WORD("for") || WORD("foreach") || WORD("function") || WORD("if") ||
         WORD("implements") || WORD("in") || WORD("int") || WORD("interface") ||
         WORD("is") || WORD("match") || WORD("mixed") || WORD("namespace") ||
         WORD("never") || WORD("new") || WORD("newtype") || WORD("null") ||
         WORD("object") || WORD("out") || WORD("parent") || WORD("private") ||
         WORD("protected") || WORD("public") || WORD("readonly") ||
         WORD("return") || WORD("self") || WORD("static") || WORD("string") ||
         WORD("throw") || WORD("true") || WORD("try") || WORD("type") ||
         WORD("use") || WORD("using") || WORD("vec") || WORD("void") ||
         WORD("while") || WORD("assert") || WORD("clone") || WORD("contains") ||
         WORD("contains_key") || WORD("debug") || WORD("directory") ||
         WORD("discard") || WORD("drop") || WORD("embed") || WORD("exit") ||
         WORD("file") || WORD("length") || WORD("panic") || WORD("remove") ||
         WORD("remove_first") || WORD("remove_last") || WORD("require") ||
         WORD("require_once") || WORD("swap_remove") || WORD("write") ||
         WORD("write_error") || WORD("write_error_line") || WORD("write_line");
}

#undef WORD

static bool scan_identifier_like(TSLexer *lexer, const bool *valid_symbols) {
  if (!is_identifier_start(lexer->lookahead)) {
    return false;
  }

  char text[32];
  size_t length = 0;
  bool may_be_reserved = true;
  bool is_wildcard = lexer->lookahead == '_';
  do {
    if (may_be_reserved && lexer->lookahead < 0x80 && length < sizeof(text)) {
      text[length] = (char)lexer->lookahead;
    } else {
      may_be_reserved = false;
    }

    length += 1;
    lexer->advance(lexer, false);
  } while (is_identifier_part(lexer->lookahead));

  lexer->mark_end(lexer);
  if (lexer->lookahead == '\\') {
    lexer->advance(lexer, false);
    if (is_identifier_start(lexer->lookahead)) {
      if (valid_symbols[NAMESPACE_NAME_SEGMENT_CONTINUING_TOKEN] &&
          !(is_wildcard && length == 1)) {
        lexer->result_symbol = NAMESPACE_NAME_SEGMENT_CONTINUING_TOKEN;
        return true;
      }

      if (valid_symbols[NAME_SEGMENT_CONTINUING_TOKEN]) {
        lexer->result_symbol = NAME_SEGMENT_CONTINUING_TOKEN;
        return true;
      }

      return false;
    }
  }

  if (!valid_symbols[IDENTIFIER_TOKEN] ||
      (may_be_reserved && is_reserved_identifier(text, length))) {
    return false;
  }

  lexer->result_symbol = IDENTIFIER_TOKEN;
  return true;
}

static bool scan_name_separator(TSLexer *lexer) {
  if (lexer->lookahead != '\\') {
    return false;
  }

  lexer->advance(lexer, false);
  lexer->mark_end(lexer);
  if (!is_identifier_start(lexer->lookahead)) {
    return false;
  }

  lexer->result_symbol = NAME_SEPARATOR;
  return true;
}

static bool scan_decimal_digits(TSLexer *lexer) {
  while (is_decimal_digit(lexer->lookahead)) {
    lexer->advance(lexer, false);
    lexer->mark_end(lexer);
    if (lexer->lookahead != '_') {
      continue;
    }

    lexer->advance(lexer, false);
    if (!is_decimal_digit(lexer->lookahead)) {
      return false;
    }
  }

  return true;
}

static bool scan_float_literal(TSLexer *lexer) {
  if (!is_decimal_digit(lexer->lookahead)) {
    return false;
  }

  if (!scan_decimal_digits(lexer)) {
    return false;
  }

  bool has_decimal_point = false;
  if (lexer->lookahead == '.') {
    lexer->advance(lexer, false);
    if (lexer->lookahead == '.') {
      return false;
    }

    has_decimal_point = true;
    lexer->mark_end(lexer);
    if (!scan_decimal_digits(lexer)) {
      lexer->result_symbol = FLOAT_LITERAL_TOKEN;
      return true;
    }
  }

  if (lexer->lookahead == 'e' || lexer->lookahead == 'E') {
    lexer->advance(lexer, false);
    if (lexer->lookahead == '+' || lexer->lookahead == '-') {
      lexer->advance(lexer, false);
    }

    if (!is_decimal_digit(lexer->lookahead)) {
      if (!has_decimal_point) {
        return false;
      }
    } else {
      (void)scan_decimal_digits(lexer);
    }
  } else if (!has_decimal_point) {
    return false;
  }

  lexer->result_symbol = FLOAT_LITERAL_TOKEN;
  return true;
}

static bool scan_single_quoted_escape(TSLexer *lexer) {
  if (lexer->lookahead != '\\') {
    return false;
  }

  lexer->advance(lexer, false);
  if (lexer->lookahead != 0) {
    lexer->advance(lexer, false);
  }

  lexer->mark_end(lexer);
  lexer->result_symbol = SINGLE_QUOTED_ESCAPE_SEQUENCE;
  return true;
}

static bool scan_double_quoted_escape(TSLexer *lexer) {
  if (lexer->lookahead != '\\') {
    return false;
  }

  lexer->advance(lexer, false);
  if (lexer->lookahead == 0) {
    lexer->mark_end(lexer);
    lexer->result_symbol = DOUBLE_QUOTED_ESCAPE_SEQUENCE;
    return true;
  }

  if (is_octal_digit(lexer->lookahead)) {
    uint16_t value = 0;
    size_t length = 0;
    do {
      value = (uint16_t)(value * 8 + (lexer->lookahead - '0'));
      length += 1;
      lexer->advance(lexer, false);
    } while (length < 3 && is_octal_digit(lexer->lookahead));
    if (value > UINT8_MAX) {
      return false;
    }
  } else if (lexer->lookahead == 'x') {
    lexer->advance(lexer, false);
    for (size_t length = 0;
         length < 2 && is_hexadecimal_digit(lexer->lookahead); length += 1) {
      lexer->advance(lexer, false);
    }
  } else if (lexer->lookahead == 'u') {
    lexer->advance(lexer, false);
    if (lexer->lookahead == '{') {
      lexer->advance(lexer, false);
      uint32_t code_point = 0;
      size_t length = 0;
      while (is_hexadecimal_digit(lexer->lookahead)) {
        uint32_t digit;
        if (is_decimal_digit(lexer->lookahead)) {
          digit = (uint32_t)(lexer->lookahead - '0');
        } else if (lexer->lookahead <= 'F') {
          digit = (uint32_t)(lexer->lookahead - 'A' + 10);
        } else {
          digit = (uint32_t)(lexer->lookahead - 'a' + 10);
        }

        if (code_point > (UINT32_MAX - digit) / 16) {
          return false;
        }

        code_point = code_point * 16 + digit;
        length += 1;
        lexer->advance(lexer, false);
      }

      if (length == 0 || lexer->lookahead != '}' || code_point > 0x10FFFF ||
          (code_point >= 0xD800 && code_point <= 0xDFFF)) {
        return false;
      }

      lexer->advance(lexer, false);
    }
  } else {
    lexer->advance(lexer, false);
  }

  lexer->mark_end(lexer);
  lexer->result_symbol = DOUBLE_QUOTED_ESCAPE_SEQUENCE;
  return true;
}

static bool scan_double_quoted_dollar(TSLexer *lexer) {
  if (lexer->lookahead != '$') {
    return false;
  }

  lexer->advance(lexer, false);
  lexer->mark_end(lexer);
  if (is_identifier_start(lexer->lookahead)) {
    return false;
  }

  lexer->result_symbol = DOUBLE_QUOTED_DOLLAR;
  return true;
}

void *tree_sitter_whim_external_scanner_create(void) { return NULL; }

void tree_sitter_whim_external_scanner_destroy(void *payload) { (void)payload; }

unsigned tree_sitter_whim_external_scanner_serialize(void *payload,
                                                     char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}

void tree_sitter_whim_external_scanner_deserialize(void *payload,
                                                   const char *buffer,
                                                   unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

bool tree_sitter_whim_external_scanner_scan(void *payload, TSLexer *lexer,
                                            const bool *valid_symbols) {
  (void)payload;

  if (valid_symbols[IDENTIFIER_TOKEN] ||
      valid_symbols[NAME_SEGMENT_CONTINUING_TOKEN] ||
      valid_symbols[NAMESPACE_NAME_SEGMENT_CONTINUING_TOKEN] ||
      valid_symbols[FLOAT_LITERAL_TOKEN]) {
    while (is_whitespace(lexer->lookahead)) {
      lexer->advance(lexer, true);
    }
  }

  if (lexer->lookahead == '\\') {
    if (valid_symbols[DOUBLE_QUOTED_ESCAPE_SEQUENCE]) {
      return scan_double_quoted_escape(lexer);
    }

    if (valid_symbols[SINGLE_QUOTED_ESCAPE_SEQUENCE]) {
      return scan_single_quoted_escape(lexer);
    }

    if (valid_symbols[NAME_SEPARATOR]) {
      return scan_name_separator(lexer);
    }

    return false;
  }

  if (valid_symbols[DOUBLE_QUOTED_DOLLAR] && lexer->lookahead == '$') {
    return scan_double_quoted_dollar(lexer);
  }

  if (valid_symbols[FLOAT_LITERAL_TOKEN] &&
      is_decimal_digit(lexer->lookahead)) {
    return scan_float_literal(lexer);
  }

  return (valid_symbols[IDENTIFIER_TOKEN] ||
          valid_symbols[NAME_SEGMENT_CONTINUING_TOKEN] ||
          valid_symbols[NAMESPACE_NAME_SEGMENT_CONTINUING_TOKEN]) &&
         scan_identifier_like(lexer, valid_symbols);
}
