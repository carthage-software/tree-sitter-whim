/**
 * @file Tree-sitter grammar for Whim
 * @author Seifeddine Gmati <azjezz@carthage.software>
 * @license MIT OR Apache-2.0
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  ASSIGNMENT: 1,
  COALESCE: 2,
  OR: 3,
  AND: 4,
  COMPARISON: 5,
  TYPE_OPERATION: 6,
  PIPE: 7,
  CONCATENATION: 8,
  BITWISE_OR: 9,
  BITWISE_XOR: 10,
  BITWISE_AND: 11,
  SHIFT: 12,
  ADDITIVE: 13,
  MULTIPLICATIVE: 14,
  UNARY: 15,
  EXPONENT: 16,
  POSTFIX: 17,
  PATTERN_AS: 20,
  PATTERN_UNION: 21,
  TYPE_UNION: 20,
  TYPE_INTERSECTION: 21,
  TYPE_NEGATION: 22,
};

const FULL_KEYWORDS = [
  "break",
  "catch",
  "continue",
  "do",
  "else",
  "false",
  "finally",
  "fn",
  "for",
  "foreach",
  "function",
  "if",
  "match",
  "new",
  "null",
  "parent",
  "return",
  "self",
  "static",
  "throw",
  "true",
  "try",
  "using",
  "while",
];

const SOFT_KEYWORDS = ["as", "is"];

const CONSTRUCT_NAMES = [
  "assert",
  "clone",
  "contains",
  "contains_key",
  "debug",
  "directory",
  "discard",
  "drop",
  "embed",
  "exit",
  "file",
  "length",
  "panic",
  "remove",
  "remove_first",
  "remove_last",
  "require",
  "require_once",
  "swap_remove",
  "write",
  "write_error",
  "write_error_line",
  "write_line",
];

const CONTEXTUAL_KEYWORDS = [
  "abstract",
  "array",
  "bool",
  "case",
  "class",
  "classname",
  "const",
  "default",
  "dict",
  "enum",
  "extends",
  "final",
  "float",
  "implements",
  "in",
  "int",
  "interface",
  "mixed",
  "namespace",
  "never",
  "newtype",
  "object",
  "out",
  "private",
  "protected",
  "public",
  "readonly",
  "string",
  "type",
  "use",
  "vec",
  "void",
];

const KEYWORDS = [...FULL_KEYWORDS, ...SOFT_KEYWORDS, ...CONTEXTUAL_KEYWORDS];
const IDENTIFIER = /(?:[A-Za-z_]|[^\x00-\x7F])(?:[A-Za-z0-9_]|[^\x00-\x7F])*/;
const NON_WILDCARD_IDENTIFIER =
  /(?:(?:[A-Za-z]|[^\x00-\x7F])(?:[A-Za-z0-9_]|[^\x00-\x7F])*|_(?:[A-Za-z0-9_]|[^\x00-\x7F])+)/;
const DECIMAL_DIGITS = /[0-9](?:_?[0-9])*/;
const EXPONENT = seq(/[eE]/, optional(/[+-]/), DECIMAL_DIGITS);

export default grammar({
  name: "whim",

  externals: ($) => [
    $._identifier_token,
    $._name_segment_continuing_token,
    $._namespace_name_segment_continuing_token,
    $._name_separator,
    $._float_literal_token,
    $.single_quoted_escape_sequence,
    $.double_quoted_escape_sequence,
    $._double_quoted_dollar,
  ],

  extras: ($) => [
    /[ \t\r\n\v\f]+/,
    $.line_comment,
    $.block_comment,
    $.documentation_comment,
  ],

  supertypes: ($) => [$._statement, $._expression, $._type, $._pattern],

  inline: ($) => [
    $._class_reference,
    $._constant_reference,
    $._literal,
    $._local_identifier,
    $._name,
    $._pattern_primary,
    $._soft_function_name,
    $._type_primary,
  ],

  conflicts: ($) => [
    [$._primary_expression, $._assignment_target],
    [$._postfix_level, $._assignment_target],
    [$._intersection_pattern_type, $._type],
    [$.function_type],
    [$.argument_list, $.partial_argument_list],
    [$.partial_argument_list],
    [$.destructure_default, $.assignment_operator],
    [$.integer_range_type],
    [$.dictionary_expression, $.dictionary_destructure, $.constant_name],
    [$.dictionary_expression, $.dictionary_destructure],
    [$.member_modifier, $.static_type],
    [$.member_type],
    [$.primitive_type, $.string_length_type],
    [$.self_type],
    [$.signed_integer_literal, $.dictionary_shape_entry],
    [$.trailing_pattern, $.trailing_type],
    [$.vector_pattern, $.vector_shape_type],
    [$.dictionary_pattern, $.dictionary_shape_type],
    [$.vector_expression, $.vector_fill_expression, $.constant_name],
    [$.dictionary_expression, $.constant_name],
    [$.array_type],
    [$.dictionary_type],
    [$.named_type],
    [$.vector_type],
    [$.vector_type, $.vector_shape_type],
    [$.dictionary_type, $.dictionary_shape_type],
  ],

  rules: {
    source_file: ($) => seq(optional($.shebang), repeat($._statement)),

    shebang: (_) => token(seq("#!/", /[^\r\n]*/)),

    line_comment: (_) => token(seq("//", /[^\r\n]*/)),
    documentation_comment: (_) =>
      token(prec(1, /\/\*\*(?:[^*]|\*+[^*/])*\*+\//)),
    block_comment: (_) =>
      choice(token(prec(2, "/**/")), token(/\/\*(?:[^*]|\*+[^*/])*\*+\//)),

    _statement: ($) =>
      choice($.namespace_definition, $._non_namespace_statement),

    _non_namespace_statement: ($) =>
      choice(
        $.empty_statement,
        $.block,
        $.use_declaration,
        $.constant_declaration,
        $.type_alias_declaration,
        $.newtype_declaration,
        $.function_declaration,
        $.class_declaration,
        $.interface_declaration,
        $.enum_declaration,
        $.if_statement,
        $.while_statement,
        $.do_while_statement,
        $.for_statement,
        $.foreach_statement,
        $.using_statement,
        $.try_statement,
        $.final_local_declaration,
        $.expression_statement,
      ),

    empty_statement: (_) => ";",
    block: ($) => seq("{", repeat($._statement), "}"),

    namespace_definition: ($) =>
      seq(
        "namespace",
        field("name", $.namespace_name),
        field("body", choice($.namespace_body, $.namespace_implicit_body)),
      ),

    namespace_body: ($) => seq("{", repeat($._statement), "}"),
    namespace_implicit_body: ($) =>
      prec.right(seq(";", repeat($._non_namespace_statement))),

    use_declaration: ($) =>
      seq(
        "use",
        field("items", choice($.use_group, commaSep1($.use_item))),
        ";",
      ),

    use_group: ($) =>
      seq(
        field("prefix", $._identifier_name),
        "\\",
        "{",
        optional(seq(commaSep1($.use_item), optional(","))),
        "}",
      ),

    use_item: ($) =>
      seq(field("name", $._identifier_name), optional($.use_alias)),
    use_alias: ($) => seq("as", field("name", $._local_identifier)),

    constant_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        "const",
        field("name", $.constant_name),
        "=",
        field("value", $._expression),
        ";",
      ),

    type_alias_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        "type",
        field("name", $._local_identifier),
        optional($.type_parameter_list),
        "=",
        field("type", $._type),
        ";",
      ),

    newtype_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        "newtype",
        field("name", $._local_identifier),
        optional($.type_parameter_list),
        "=",
        field("type", $._type),
        ";",
      ),

    function_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        "function",
        field("name", $.function_name),
        optional($.type_parameter_list),
        field("parameters", $.parameter_list),
        optional($.return_type),
        field("body", $.block),
      ),

    class_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        repeat(field("modifier", $.class_modifier)),
        "class",
        field("name", $._local_identifier),
        optional($.type_parameter_list),
        optional($.extends_clause),
        optional($.implements_clause),
        optional($.sealed_permissions),
        field("body", $.class_body),
      ),

    interface_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        "interface",
        field("name", $._local_identifier),
        optional($.type_parameter_list),
        optional($.extends_clause),
        optional($.sealed_permissions),
        field("body", $.class_body),
      ),

    enum_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        "enum",
        field("name", $._local_identifier),
        optional($.type_parameter_list),
        optional($.enum_backing_type),
        optional($.implements_clause),
        field("body", $.class_body),
      ),

    enum_backing_type: ($) => seq(":", field("type", $._type)),
    extends_clause: ($) =>
      seq("extends", commaSep1(field("type", $.named_type))),
    implements_clause: ($) =>
      seq("implements", commaSep1(field("type", $.named_type))),
    sealed_permissions: ($) =>
      seq("for", commaSep1(field("type", $._identifier_name))),

    class_body: ($) => seq("{", repeat($._class_member), "}"),

    _class_member: ($) =>
      choice(
        $.enum_case_declaration,
        $.class_constant_declaration,
        $.method_declaration,
        $.property_declaration,
      ),

    enum_case_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        "case",
        field("name", $.member_name),
        optional($.enum_case_value),
        ";",
      ),

    enum_case_value: ($) => seq("=", field("value", $._expression)),

    class_constant_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        repeat(field("modifier", $.member_modifier)),
        "const",
        choice(
          seq(field("type", $._type), field("name", $.member_name)),
          field("name", $.member_name),
        ),
        "=",
        field("value", $._expression),
        ";",
      ),

    method_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        repeat(field("modifier", $.member_modifier)),
        "function",
        field("name", $.member_name),
        optional($.type_parameter_list),
        field("parameters", $.parameter_list),
        optional($.return_type),
        field("body", choice($.block, ";")),
      ),

    property_declaration: ($) =>
      seq(
        repeat($.attribute_group),
        repeat(field("modifier", $.member_modifier)),
        optional(field("type", $._type)),
        field("name", $.variable),
        optional($.property_default),
        ";",
      ),

    property_default: ($) => seq("=", field("value", $._expression)),

    class_modifier: (_) =>
      choice(
        "abstract",
        "final",
        "readonly",
        "public",
        "protected",
        "private",
        "static",
      ),

    member_modifier: (_) =>
      choice(
        "public",
        "protected",
        "private",
        "static",
        "final",
        "abstract",
        "readonly",
      ),

    attribute_group: ($) =>
      seq("#[", optional(seq(commaSep1($.attribute), optional(","))), "]"),
    attribute: ($) =>
      seq(
        field("name", $._identifier_name),
        optional(field("arguments", $.argument_list)),
      ),

    type_parameter_list: ($) =>
      seq("<", commaSep1($.type_parameter), optional(","), ">"),

    type_parameter: ($) =>
      seq(
        optional(field("variance", $.type_variance)),
        field("name", $._local_identifier),
        optional($.type_parameter_bound),
        optional($.type_parameter_default),
      ),

    type_variance: (_) => choice("in", "out"),
    type_parameter_bound: ($) =>
      seq(
        ":",
        field("type", $._type),
        repeat(seq("+", field("type", $._type))),
      ),
    type_parameter_default: ($) => seq("=", field("type", $._type)),

    parameter_list: ($) =>
      seq("(", optional(seq(commaSep1($.parameter), optional(","))), ")"),

    parameter: ($) =>
      seq(
        repeat($.attribute_group),
        repeat(field("modifier", $.member_modifier)),
        optional(field("type", $._type)),
        field("name", $.variable),
        optional($.parameter_default),
      ),

    parameter_default: ($) => seq("=", field("value", $._expression)),

    return_type: ($) => seq(":", field("type", $._type)),

    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $.parenthesized_expression),
          field("consequence", $.block),
          optional($.else_clause),
        ),
      ),

    else_clause: ($) =>
      seq("else", field("body", choice($.if_statement, $.block))),

    while_statement: ($) =>
      seq(
        "while",
        field("condition", $.parenthesized_expression),
        field("body", $.block),
      ),

    do_while_statement: ($) =>
      seq(
        "do",
        field("body", $.block),
        "while",
        field("condition", $.parenthesized_expression),
        ";",
      ),

    for_statement: ($) =>
      seq(
        "for",
        "(",
        field("initializer", optional($.expression_list)),
        ";",
        field("condition", optional($.expression_list)),
        ";",
        field("update", optional($.expression_list)),
        ")",
        field("body", $.block),
      ),

    expression_list: ($) => commaSep1($._expression),

    foreach_statement: ($) =>
      seq(
        "foreach",
        "(",
        field("collection", $._foreach_expression),
        "as",
        field(
          "target",
          choice($.foreach_value_target, $.foreach_key_value_target),
        ),
        ")",
        field("body", $.block),
      ),

    foreach_value_target: ($) => field("value", $._assignment_target),

    foreach_key_value_target: ($) =>
      seq(
        field("key", $._assignment_target),
        "=>",
        field("value", $._assignment_target),
      ),

    using_statement: ($) =>
      seq(
        "using",
        "(",
        commaSep1($.using_binding),
        optional(","),
        ")",
        field("body", $.block),
      ),

    using_binding: ($) =>
      prec(
        PREC.COALESCE,
        seq(
          field("target", $._binding_target),
          "=",
          field("value", $._expression),
        ),
      ),

    try_statement: ($) =>
      prec.right(
        seq(
          "try",
          field("body", $.block),
          repeat($.catch_clause),
          optional($.try_else_clause),
          optional($.finally_clause),
        ),
      ),

    catch_clause: ($) =>
      seq(
        "catch",
        "(",
        field("type", $._type),
        optional(field("name", $.variable)),
        ")",
        optional($.catch_guard),
        field("body", $.block),
      ),

    catch_guard: ($) =>
      seq("if", field("condition", $.parenthesized_expression)),
    try_else_clause: ($) => seq("else", field("body", $.block)),
    finally_clause: ($) => seq("finally", field("body", $.block)),

    final_local_declaration: ($) =>
      seq(
        "final",
        field("name", $.variable),
        "=",
        field("value", $._expression),
        ";",
      ),

    expression_statement: ($) => seq($._expression, ";"),

    _expression: ($) => $._assignment_level,

    _assignment_level: ($) =>
      choice($.assignment_expression, $._coalesce_level),

    _coalesce_level: ($) =>
      choice(
        alias($._coalesce_expression, $.binary_expression),
        $._logical_or_level,
      ),
    _coalesce_expression: ($) =>
      prec.right(
        PREC.COALESCE,
        seq(
          field("left", $._logical_or_level),
          field("operator", "??"),
          field("right", $._coalesce_level),
        ),
      ),

    _logical_or_level: ($) =>
      choice(
        alias($._logical_or_expression, $.binary_expression),
        $._logical_and_level,
      ),
    _logical_or_expression: ($) =>
      prec.left(
        PREC.OR,
        seq(
          field("left", $._logical_or_level),
          field("operator", "||"),
          field("right", $._logical_and_level),
        ),
      ),

    _logical_and_level: ($) =>
      choice(
        alias($._logical_and_expression, $.binary_expression),
        $._comparison_level,
      ),
    _logical_and_expression: ($) =>
      prec.left(
        PREC.AND,
        seq(
          field("left", $._logical_and_level),
          field("operator", "&&"),
          field("right", $._comparison_level),
        ),
      ),

    _comparison_level: ($) =>
      choice($.comparison_expression, $._type_operation_level),
    _type_operation_level: ($) =>
      choice($.type_operation_expression, $._pipe_level),

    _pipe_level: ($) =>
      choice(
        alias($._pipe_expression, $.binary_expression),
        $._concatenation_level,
      ),
    _pipe_expression: ($) =>
      prec.left(
        PREC.PIPE,
        seq(
          field("left", $._pipe_level),
          field("operator", "|>"),
          field("right", $._concatenation_level),
        ),
      ),

    _concatenation_level: ($) =>
      choice(
        alias($._concatenation_expression, $.binary_expression),
        $._bitwise_or_level,
      ),
    _concatenation_expression: ($) =>
      prec.left(
        PREC.CONCATENATION,
        seq(
          field("left", $._concatenation_level),
          field("operator", "."),
          field("right", $._bitwise_or_level),
        ),
      ),

    _bitwise_or_level: ($) =>
      choice(
        alias($._bitwise_or_expression, $.binary_expression),
        $._bitwise_xor_level,
      ),
    _bitwise_or_expression: ($) =>
      prec.left(
        PREC.BITWISE_OR,
        seq(
          field("left", $._bitwise_or_level),
          field("operator", "|"),
          field("right", $._bitwise_xor_level),
        ),
      ),

    _bitwise_xor_level: ($) =>
      choice(
        alias($._bitwise_xor_expression, $.binary_expression),
        $._bitwise_and_level,
      ),
    _bitwise_xor_expression: ($) =>
      prec.left(
        PREC.BITWISE_XOR,
        seq(
          field("left", $._bitwise_xor_level),
          field("operator", "^"),
          field("right", $._bitwise_and_level),
        ),
      ),

    _bitwise_and_level: ($) =>
      choice(
        alias($._bitwise_and_expression, $.binary_expression),
        $._shift_level,
      ),
    _bitwise_and_expression: ($) =>
      prec.left(
        PREC.BITWISE_AND,
        seq(
          field("left", $._bitwise_and_level),
          field("operator", "&"),
          field("right", $._shift_level),
        ),
      ),

    _shift_level: ($) =>
      choice(
        alias($._shift_expression, $.binary_expression),
        $._additive_level,
      ),
    _shift_expression: ($) =>
      prec.left(
        PREC.SHIFT,
        seq(
          field("left", $._shift_level),
          field("operator", choice("<<", ">>")),
          field("right", $._additive_level),
        ),
      ),

    _additive_level: ($) =>
      choice(
        alias($._additive_expression, $.binary_expression),
        $._multiplicative_level,
      ),
    _additive_expression: ($) =>
      prec.left(
        PREC.ADDITIVE,
        seq(
          field("left", $._additive_level),
          field("operator", choice("+", "-")),
          field("right", $._multiplicative_level),
        ),
      ),

    _multiplicative_level: ($) =>
      choice(
        alias($._multiplicative_expression, $.binary_expression),
        $._unary_level,
      ),
    _multiplicative_expression: ($) =>
      prec.left(
        PREC.MULTIPLICATIVE,
        seq(
          field("left", $._multiplicative_level),
          field("operator", choice("*", "/", "%")),
          field("right", $._unary_level),
        ),
      ),

    _unary_level: ($) =>
      choice(
        $.unary_expression,
        alias($._prefix_update_expression, $.update_expression),
        $._exponent_level,
      ),
    _exponent_level: ($) =>
      choice(
        alias($._exponent_expression, $.binary_expression),
        $._postfix_level,
      ),
    _exponent_expression: ($) =>
      prec.right(
        PREC.EXPONENT,
        seq(
          field("left", $._postfix_level),
          field("operator", "**"),
          field("right", $._unary_level),
        ),
      ),

    _postfix_level: ($) =>
      choice(
        $._primary_expression,
        alias($._postfix_update_expression, $.update_expression),
        $.function_call_expression,
        $.function_partial_application_expression,
        $.method_call_expression,
        $.method_partial_application_expression,
        $.null_safe_method_call_expression,
        $.static_method_call_expression,
        $.static_method_partial_application_expression,
        $.property_access_expression,
        $.null_safe_property_access_expression,
        $.static_property_access_expression,
        $.class_constant_access_expression,
        $.subscript_expression,
      ),

    _primary_expression: ($) =>
      choice(
        $._literal,
        $.interpolated_string,
        $.variable,
        $.constant_access_expression,
        $.parenthesized_expression,
        $.tuple_expression,
        $.vector_expression,
        $.vector_fill_expression,
        $.dictionary_expression,
        $.closure_expression,
        $.short_closure_expression,
        $.match_expression,
        $.object_creation_expression,
        $.break_expression,
        $.continue_expression,
        $.return_expression,
        $.throw_expression,
        $._construct_expression,
      ),

    _foreach_expression: ($) => $._foreach_assignment_level,

    _foreach_assignment_level: ($) =>
      choice(
        alias($._foreach_assignment_expression, $.assignment_expression),
        $._foreach_coalesce_level,
      ),
    _foreach_assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq(
          field("left", $._assignment_target),
          field("operator", $.assignment_operator),
          field("right", $._foreach_assignment_level),
        ),
      ),

    _foreach_coalesce_level: ($) =>
      choice(
        alias($._foreach_coalesce_expression, $.binary_expression),
        $._foreach_logical_or_level,
      ),
    _foreach_coalesce_expression: ($) =>
      prec.right(
        PREC.COALESCE,
        seq(
          field("left", $._foreach_logical_or_level),
          field("operator", "??"),
          field("right", $._foreach_coalesce_level),
        ),
      ),

    _foreach_logical_or_level: ($) =>
      choice(
        alias($._foreach_logical_or_expression, $.binary_expression),
        $._foreach_logical_and_level,
      ),
    _foreach_logical_or_expression: ($) =>
      prec.left(
        PREC.OR,
        seq(
          field("left", $._foreach_logical_or_level),
          field("operator", "||"),
          field("right", $._foreach_logical_and_level),
        ),
      ),

    _foreach_logical_and_level: ($) =>
      choice(
        alias($._foreach_logical_and_expression, $.binary_expression),
        $._foreach_comparison_level,
      ),
    _foreach_logical_and_expression: ($) =>
      prec.left(
        PREC.AND,
        seq(
          field("left", $._foreach_logical_and_level),
          field("operator", "&&"),
          field("right", $._foreach_comparison_level),
        ),
      ),

    _foreach_comparison_level: ($) =>
      choice(
        alias($._foreach_comparison_expression, $.comparison_expression),
        $._foreach_type_operation_level,
      ),
    _foreach_comparison_expression: ($) =>
      prec(
        PREC.COMPARISON,
        seq(
          field("left", $._foreach_type_operation_level),
          field("operator", $.comparison_operator),
          field("right", $._foreach_type_operation_level),
        ),
      ),

    _foreach_type_operation_level: ($) =>
      choice(
        alias(
          $._foreach_type_operation_expression,
          $.type_operation_expression,
        ),
        $._pipe_level,
      ),
    _foreach_type_operation_expression: ($) =>
      prec(
        PREC.TYPE_OPERATION,
        seq(
          field("value", $._pipe_level),
          field("operator", choice("is", seq("?", "as"))),
          field("type", $._type),
        ),
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    tuple_expression: ($) =>
      seq(
        "(",
        $._expression,
        ",",
        repeat(seq(choice($._expression, $.tuple_rest_element), ",")),
        optional(choice($._expression, $.tuple_rest_element)),
        ")",
      ),

    tuple_rest_element: ($) =>
      seq("...", optional(field("value", $._expression))),

    vector_expression: ($) =>
      seq(
        "vec",
        "[",
        optional(seq(commaSep1($.vector_element), optional(","))),
        "]",
      ),

    vector_element: ($) => seq(optional("..."), field("value", $._expression)),

    vector_fill_expression: ($) =>
      seq(
        "vec",
        "[",
        field("value", $._expression),
        ";",
        field("size", $._expression),
        "]",
      ),

    dictionary_expression: ($) =>
      seq(
        "dict",
        "[",
        optional(seq(commaSep1($.dictionary_entry), optional(","))),
        "]",
      ),

    dictionary_entry: ($) => choice($.dictionary_pair, $.dictionary_spread),
    dictionary_pair: ($) =>
      seq(field("key", $._expression), "=>", field("value", $._expression)),
    dictionary_spread: ($) => seq("...", field("value", $._expression)),

    closure_expression: ($) =>
      seq(
        repeat($.attribute_group),
        "function",
        optional($.type_parameter_list),
        field("parameters", $.parameter_list),
        optional($.closure_use_clause),
        optional($.return_type),
        field("body", $.block),
      ),

    closure_use_clause: ($) =>
      seq("use", "(", optional(seq(commaSep1($.variable), optional(","))), ")"),

    short_closure_expression: ($) =>
      seq(
        repeat($.attribute_group),
        "fn",
        optional($.type_parameter_list),
        field("parameters", $.parameter_list),
        optional($.return_type),
        field("body", $.short_closure_body),
      ),

    short_closure_body: ($) =>
      choice(seq("=>", field("value", $._expression)), $.block),

    match_expression: ($) =>
      seq(
        "match",
        "(",
        field("value", $._expression),
        ")",
        "{",
        optional(seq(commaSep1($.match_arm), optional(","))),
        "}",
      ),

    match_arm: ($) =>
      seq(field("pattern", $._pattern), "=>", field("value", $._expression)),

    _pattern: ($) => choice($.as_pattern, $.union_pattern, $._pattern_primary),

    as_pattern: ($) =>
      prec.right(
        PREC.PATTERN_AS,
        seq(
          field("target", $._pattern_primary),
          "@",
          field("pattern", $._pattern),
        ),
      ),

    union_pattern: ($) =>
      prec.left(
        PREC.PATTERN_UNION,
        seq(field("left", $._pattern), "|", field("right", $._pattern)),
      ),

    _pattern_primary: ($) =>
      choice(
        $.variable_pattern,
        $.type_pattern,
        $.parenthesized_pattern,
        $.tuple_pattern,
        $.vector_pattern,
        $.dictionary_pattern,
      ),

    variable_pattern: ($) => $.variable,
    type_pattern: ($) =>
      prec(PREC.PATTERN_UNION + 1, $._intersection_pattern_type),
    _intersection_pattern_type: ($) =>
      choice($.intersection_type, $.negated_type, $._type_primary),

    parenthesized_pattern: ($) => seq("(", $._pattern, ")"),

    tuple_pattern: ($) =>
      seq(
        "(",
        choice(
          $.trailing_pattern,
          seq(
            $._pattern,
            ",",
            repeat(seq($._pattern, ",")),
            optional(choice($._pattern, $.trailing_pattern)),
          ),
        ),
        ")",
      ),

    vector_pattern: ($) =>
      seq(
        "vec",
        "[",
        optional(
          choice(
            seq($.trailing_pattern, optional(",")),
            seq(
              commaSep1($._pattern),
              optional(seq(",", $.trailing_pattern)),
              optional(","),
            ),
          ),
        ),
        "]",
      ),

    dictionary_pattern: ($) =>
      seq(
        "dict",
        "[",
        optional(
          choice(
            seq($.trailing_pattern, optional(",")),
            seq(
              commaSep1($.dictionary_pattern_entry),
              optional(seq(",", $.trailing_pattern)),
              optional(","),
            ),
          ),
        ),
        "]",
      ),

    dictionary_pattern_entry: ($) =>
      seq(
        field("key", choice($.string_literal, $.signed_integer_literal)),
        "=>",
        field("pattern", $._pattern),
      ),

    trailing_pattern: ($) => seq("...", optional(field("pattern", $._pattern))),

    object_creation_expression: ($) =>
      prec.right(
        PREC.UNARY,
        seq(
          "new",
          field("class", $._class_reference),
          optional(field("arguments", $.argument_list)),
        ),
      ),

    _class_reference: ($) =>
      choice(
        seq(field("name", $._name), optional($.turbofish)),
        $.relative_scope,
        $.variable,
        $.parenthesized_expression,
      ),

    break_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq("break", optional(field("level", $.integer_literal))),
      ),

    continue_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq("continue", optional(field("level", $.integer_literal))),
      ),

    return_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq("return", optional(field("value", $._expression))),
      ),

    throw_expression: ($) =>
      prec.right(PREC.ASSIGNMENT, seq("throw", field("value", $._expression))),

    _construct_expression: ($) =>
      choice(
        $.require_construct,
        $.require_once_construct,
        $.length_construct,
        $.contains_construct,
        $.contains_key_construct,
        $.clone_construct,
        $.remove_construct,
        $.swap_remove_construct,
        $.remove_first_construct,
        $.remove_last_construct,
        $.assert_construct,
        $.exit_construct,
        $.panic_construct,
        $.write_construct,
        $.write_line_construct,
        $.write_error_construct,
        $.write_error_line_construct,
        $.debug_construct,
        $.discard_construct,
        $.drop_construct,
        $.file_construct,
        $.directory_construct,
        $.embed_construct,
      ),

    require_construct: ($) => unaryConstruct($, "require", "value"),
    require_once_construct: ($) => unaryConstruct($, "require_once", "value"),
    length_construct: ($) => unaryConstruct($, "length", "value"),
    contains_construct: ($) => binaryConstruct($, "contains", "array", "value"),
    contains_key_construct: ($) =>
      binaryConstruct($, "contains_key", "array", "key"),

    clone_construct: ($) =>
      construct(
        "clone",
        seq(
          field("object", $._expression),
          repeat(seq(",", $.clone_field)),
          optional(","),
        ),
      ),

    clone_field: ($) =>
      seq(field("name", $.member_name), ":", field("value", $._expression)),

    remove_construct: ($) => binaryConstruct($, "remove", "array", "key"),
    swap_remove_construct: ($) =>
      binaryConstruct($, "swap_remove", "vector", "index"),
    remove_first_construct: ($) => unaryConstruct($, "remove_first", "array"),
    remove_last_construct: ($) => unaryConstruct($, "remove_last", "array"),

    assert_construct: ($) =>
      construct(
        "assert",
        seq(
          field("condition", $._expression),
          optional($.assert_message),
          optional(","),
        ),
      ),

    assert_message: ($) => seq(",", field("value", $._expression)),

    exit_construct: ($) =>
      construct(
        "exit",
        optional(seq(field("code", $._expression), optional(","))),
      ),

    panic_construct: ($) => literalStringConstruct($, "panic", "message"),
    write_construct: ($) => variadicConstruct($, "write"),
    write_line_construct: ($) => variadicConstruct($, "write_line"),
    write_error_construct: ($) => variadicConstruct($, "write_error"),
    write_error_line_construct: ($) => variadicConstruct($, "write_error_line"),
    debug_construct: ($) => variadicConstruct($, "debug"),
    construct_argument: ($) => field("value", $._expression),
    discard_construct: ($) => unaryConstruct($, "discard", "value"),

    drop_construct: ($) =>
      construct(
        "drop",
        seq(commaSep1(field("variable", $.variable)), optional(",")),
      ),

    file_construct: (_) => construct("file"),
    directory_construct: (_) => construct("directory"),
    embed_construct: ($) => literalStringConstruct($, "embed", "path"),

    unary_expression: ($) =>
      seq(
        field("operator", choice("!", "~", "+", "-")),
        field("operand", $._unary_level),
      ),

    _prefix_update_expression: ($) =>
      seq(
        field("operator", choice("++", "--")),
        field("operand", $._unary_level),
      ),

    _postfix_update_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("operand", $._postfix_level),
          field("operator", choice("++", "--")),
        ),
      ),

    comparison_expression: ($) =>
      prec(
        PREC.COMPARISON,
        seq(
          field("left", $._type_operation_level),
          field("operator", $.comparison_operator),
          field("right", $._type_operation_level),
        ),
      ),

    comparison_operator: (_) => choice("==", "!=", "<", "<=", ">", ">=", "<=>"),

    type_operation_expression: ($) =>
      prec(
        PREC.TYPE_OPERATION,
        seq(
          field("value", $._pipe_level),
          field("operator", choice("is", "as", seq("?", "as"))),
          field("type", $._type),
        ),
      ),

    _assignment_target: ($) =>
      choice(
        $.variable,
        $.property_access_expression,
        $.static_property_access_expression,
        $.subscript_expression,
        $.append_expression,
        $.parenthesized_assignment_target,
        $.tuple_destructure,
        $.dictionary_destructure,
      ),

    parenthesized_assignment_target: ($) => seq("(", $._assignment_target, ")"),

    tuple_destructure: ($) =>
      seq(
        "(",
        choice($._assignment_target, $.destructure_default),
        ",",
        repeat(seq($._destructure_element, ",")),
        optional($._destructure_element),
        ")",
      ),

    _destructure_element: ($) =>
      choice($._assignment_target, $.destructure_default, $.destructure_rest),

    destructure_default: ($) =>
      seq(
        field("target", $._assignment_target),
        "=",
        field("value", $._expression),
      ),

    destructure_rest: ($) =>
      seq("...", optional(field("target", $._assignment_target))),

    dictionary_destructure: ($) =>
      seq(
        "dict",
        "[",
        optional(seq(commaSep1($.dictionary_destructure_entry), optional(","))),
        "]",
      ),

    dictionary_destructure_entry: ($) =>
      seq(
        field("key", $._expression),
        "=>",
        field("target", $._assignment_target),
      ),

    _binding_target: ($) =>
      choice($.variable, $.tuple_binding_target, $.dictionary_binding_target),

    tuple_binding_target: ($) =>
      seq(
        "(",
        $._binding_target,
        ",",
        repeat(seq(choice($._binding_target, $.trailing_binding_target), ",")),
        optional(choice($._binding_target, $.trailing_binding_target)),
        ")",
      ),

    trailing_binding_target: ($) =>
      seq("...", optional(field("target", $._binding_target))),

    dictionary_binding_target: ($) =>
      seq(
        "dict",
        "[",
        optional(seq(commaSep1($.dictionary_binding_entry), optional(","))),
        "]",
      ),

    dictionary_binding_entry: ($) =>
      seq(
        field("key", $._expression),
        "=>",
        field("target", $._binding_target),
      ),

    assignment_expression: ($) =>
      prec.right(
        seq(
          field("left", $._assignment_target),
          field("operator", $.assignment_operator),
          field("right", $._assignment_level),
        ),
      ),

    assignment_operator: (_) =>
      choice(
        "=",
        "+=",
        "-=",
        "*=",
        "/=",
        "%=",
        "**=",
        ".=",
        "&=",
        "|=",
        "^=",
        "<<=",
        ">>=",
        "??=",
        "&&=",
        "||=",
      ),

    function_call_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        choice(
          seq(
            field("function", $._postfix_level),
            optional($.turbofish),
            field("arguments", $.argument_list),
          ),
          seq(
            field("function", $._soft_function_name),
            field("arguments", $.argument_list),
          ),
        ),
      ),

    function_partial_application_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        choice(
          seq(
            field("function", $._postfix_level),
            optional($.turbofish),
            field("arguments", $.partial_argument_list),
          ),
          seq(
            field("function", $._soft_function_name),
            field("arguments", $.partial_argument_list),
          ),
        ),
      ),

    method_call_expression: ($) =>
      prec.left(
        PREC.POSTFIX + 1,
        seq(
          field("object", $._postfix_level),
          "->",
          field("method", $.member_name),
          optional($.turbofish),
          field("arguments", $.argument_list),
        ),
      ),

    method_partial_application_expression: ($) =>
      prec.left(
        PREC.POSTFIX + 1,
        seq(
          field("object", $._postfix_level),
          "->",
          field("method", $.member_name),
          optional($.turbofish),
          field("arguments", $.partial_argument_list),
        ),
      ),

    null_safe_method_call_expression: ($) =>
      prec.left(
        PREC.POSTFIX + 1,
        seq(
          field("object", $._postfix_level),
          "?->",
          field("method", $.member_name),
          optional($.turbofish),
          field("arguments", $.argument_list),
        ),
      ),

    argument_list: ($) =>
      seq("(", optional(seq(commaSep1($.argument), optional(","))), ")"),

    argument: ($) => choice($.named_argument, $.positional_argument),

    partial_argument_list: ($) =>
      seq(
        "(",
        choice(
          seq(
            repeat(seq($.argument, ",")),
            $._placeholder_argument,
            repeat(seq(",", choice($.argument, $._placeholder_argument))),
            optional(","),
          ),
          seq(
            repeat(seq(choice($.argument, $._placeholder_argument), ",")),
            $.variadic_placeholder_argument,
          ),
        ),
        ")",
      ),

    _placeholder_argument: ($) =>
      choice($.placeholder_argument, $.named_placeholder_argument),

    positional_argument: ($) => field("value", $._expression),
    named_argument: ($) =>
      seq(field("name", $.member_name), ":", field("value", $._expression)),
    placeholder_argument: (_) => "?",
    named_placeholder_argument: ($) =>
      seq(field("name", $.member_name), ":", "?"),
    variadic_placeholder_argument: (_) => "...",

    property_access_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("object", $._postfix_level),
          "->",
          field("property", $.member_name),
        ),
      ),

    null_safe_property_access_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("object", $._postfix_level),
          "?->",
          field("property", $.member_name),
        ),
      ),

    static_method_call_expression: ($) =>
      prec.left(
        PREC.POSTFIX + 1,
        seq(
          field("class", choice($._postfix_level, $.relative_scope)),
          optional(field("class_arguments", $.turbofish)),
          "::",
          field("method", $.member_name),
          optional(field("method_arguments", $.turbofish)),
          field("arguments", $.argument_list),
        ),
      ),

    static_method_partial_application_expression: ($) =>
      prec.left(
        PREC.POSTFIX + 1,
        seq(
          field("class", choice($._postfix_level, $.relative_scope)),
          optional(field("class_arguments", $.turbofish)),
          "::",
          field("method", $.member_name),
          optional(field("method_arguments", $.turbofish)),
          field("arguments", $.partial_argument_list),
        ),
      ),

    static_property_access_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("class", choice($._postfix_level, $.relative_scope)),
          optional(field("class_arguments", $.turbofish)),
          "::",
          field("property", $.variable),
        ),
      ),

    class_constant_access_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("class", choice($._postfix_level, $.relative_scope)),
          optional(field("class_arguments", $.turbofish)),
          "::",
          field("constant", $.member_name),
        ),
      ),

    relative_scope: (_) => choice("self", "parent", "static"),

    subscript_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("value", $._postfix_level),
          "[",
          field("index", $._expression),
          "]",
        ),
      ),

    append_expression: ($) =>
      prec.left(PREC.POSTFIX, seq(field("value", $._postfix_level), "[", "]")),

    _literal: ($) =>
      choice(
        $.boolean_literal,
        $.null_literal,
        $.integer_literal,
        $.float_literal,
        $.string_literal,
      ),

    boolean_literal: (_) => choice("true", "false"),
    null_literal: (_) => "null",

    integer_literal: (_) =>
      token(
        choice(
          /0[xX][0-9A-Fa-f](?:_?[0-9A-Fa-f])*/,
          /0[bB][01](?:_?[01])*/,
          /0[oO][0-7](?:_?[0-7])*/,
          /0|[1-9](?:_?[0-9])*/,
        ),
      ),

    float_literal: ($) =>
      choice(
        $._float_literal_token,
        token(seq(".", DECIMAL_DIGITS, optional(EXPONENT))),
      ),

    signed_integer_literal: ($) => seq(optional("-"), $.integer_literal),

    string_literal: ($) =>
      choice($.single_quoted_string, $.double_quoted_string),

    single_quoted_string: ($) =>
      seq(
        "'",
        repeat(
          choice(
            alias($._single_quoted_string_content, $.string_content),
            $.single_quoted_escape_sequence,
          ),
        ),
        "'",
      ),

    double_quoted_string: ($) =>
      seq(
        '"',
        repeat(
          choice(
            alias($._double_quoted_string_content, $.string_content),
            alias($._double_quoted_dollar, $.string_content),
            $.double_quoted_escape_sequence,
          ),
        ),
        '"',
      ),

    interpolated_string: ($) =>
      seq(
        '"',
        repeat(
          choice(
            alias($._double_quoted_string_content, $.string_content),
            alias($._double_quoted_dollar, $.string_content),
            $.double_quoted_escape_sequence,
          ),
        ),
        choice($.variable_interpolation, $.braced_interpolation),
        repeat(
          choice(
            alias($._double_quoted_string_content, $.string_content),
            alias($._double_quoted_dollar, $.string_content),
            $.double_quoted_escape_sequence,
            $.variable_interpolation,
            $.braced_interpolation,
          ),
        ),
        '"',
      ),

    _single_quoted_string_content: (_) => token.immediate(prec(1, /[^'\\]+/)),
    _double_quoted_string_content: (_) =>
      token.immediate(prec(1, /[^"\\${}]+/)),
    variable_interpolation: ($) => $.variable,
    braced_interpolation: ($) => seq("{", field("value", $._expression), "}"),

    _constant_reference: ($) =>
      choice($.constant_name, $.qualified_name, $.fully_qualified_name),

    constant_access_expression: ($) => field("name", $._constant_reference),

    _type: ($) =>
      choice(
        $.union_type,
        $.intersection_type,
        $.negated_type,
        $._type_primary,
      ),

    union_type: ($) =>
      prec.left(
        PREC.TYPE_UNION,
        seq(field("left", $._type), "|", field("right", $._type)),
      ),

    intersection_type: ($) =>
      prec.left(
        PREC.TYPE_INTERSECTION,
        seq(field("left", $._type), "&", field("right", $._type)),
      ),

    negated_type: ($) =>
      prec.right(PREC.TYPE_NEGATION, seq("!", field("type", $._type))),

    _type_primary: ($) =>
      choice(
        $.wildcard_type,
        $.primitive_type,
        $.literal_type,
        $.negative_literal_type,
        $.integer_range_type,
        $.string_length_type,
        $.named_type,
        $.self_type,
        $.parent_type,
        $.static_type,
        $.parenthesized_type,
        $.tuple_type,
        $.function_type,
        $.array_type,
        $.vector_type,
        $.vector_shape_type,
        $.dictionary_type,
        $.dictionary_shape_type,
        $.classname_type,
      ),

    primitive_type: (_) =>
      choice(
        "string",
        "int",
        "float",
        "bool",
        "void",
        "mixed",
        "never",
        "object",
      ),

    wildcard_type: (_) => "_",

    literal_type: ($) =>
      choice(
        $.boolean_literal,
        $.null_literal,
        $.integer_literal,
        $.float_literal,
        $.string_literal,
      ),

    negative_literal_type: ($) =>
      seq("-", field("value", choice($.integer_literal, $.float_literal))),

    integer_range_type: ($) =>
      prec(
        1,
        choice(
          seq(
            optional(field("lower", $.signed_integer_literal)),
            field("operator", $.range_operator),
            field("upper", $.signed_integer_literal),
          ),
          seq(
            field("lower", $.signed_integer_literal),
            field("operator", $.range_operator),
          ),
        ),
      ),

    range_operator: (_) => choice("..", "..="),

    string_length_type: ($) =>
      seq(
        "string",
        "[",
        field("length", choice($.integer_literal, $.nonnegative_integer_range)),
        "]",
      ),

    nonnegative_integer_range: ($) =>
      prec(
        1,
        choice(
          seq(
            optional(field("lower", $.integer_literal)),
            field("operator", $.range_operator),
            field("upper", $.integer_literal),
          ),
          seq(
            field("lower", $.integer_literal),
            field("operator", $.range_operator),
          ),
        ),
      ),

    named_type: ($) =>
      seq(
        field("name", $._name),
        optional($.type_argument_list),
        optional($.member_type),
      ),

    self_type: ($) => seq("self", optional($.member_type)),
    parent_type: (_) => "parent",
    static_type: (_) => "static",

    member_type: ($) =>
      seq(
        "::",
        field("name", $._local_identifier),
        optional($.type_argument_list),
      ),

    type_argument_list: ($) =>
      seq("<", commaSep1($.type_argument), optional(","), ">"),

    type_argument: ($) => field("type", $._type),

    turbofish: ($) => seq(token("::<"), commaSep1($._type), optional(","), ">"),

    parenthesized_type: ($) => seq("(", field("type", $._type), ")"),

    tuple_type: ($) =>
      seq(
        "(",
        choice(
          $.trailing_type,
          seq(
            $._type,
            ",",
            repeat(seq($._type, ",")),
            optional(choice($._type, $.trailing_type)),
          ),
        ),
        ")",
      ),

    trailing_type: ($) => seq("...", optional(field("type", $._type))),

    function_type: ($) => seq("fn", optional($.function_type_signature)),

    function_type_signature: ($) =>
      seq(
        "(",
        optional(seq(commaSep1($.function_type_parameter), optional(","))),
        ")",
        ":",
        field("return_type", $._type),
      ),

    function_type_parameter: ($) =>
      seq(optional(field("optional", "=")), field("type", $._type)),

    array_type: ($) => seq("array", optional($.type_argument_list)),
    vector_type: ($) => seq("vec", optional($.type_argument_list)),

    vector_shape_type: ($) =>
      seq(
        "vec",
        "[",
        optional(
          choice(
            seq($.trailing_type, optional(",")),
            seq(
              commaSep1($._type),
              optional(seq(",", $.trailing_type)),
              optional(","),
            ),
          ),
        ),
        "]",
      ),

    dictionary_type: ($) => seq("dict", optional($.type_argument_list)),

    dictionary_shape_type: ($) =>
      seq(
        "dict",
        "[",
        optional(
          choice(
            seq($.dictionary_shape_rest, optional(",")),
            seq(
              commaSep1($.dictionary_shape_entry),
              optional(seq(",", $.dictionary_shape_rest)),
              optional(","),
            ),
          ),
        ),
        "]",
      ),

    dictionary_shape_entry: ($) =>
      seq(
        field("key", choice($.string_literal, $.integer_literal)),
        "=>",
        field("type", $._type),
      ),

    dictionary_shape_rest: ($) =>
      seq("...", "<", field("key", $._type), ",", field("value", $._type), ">"),

    classname_type: ($) => seq("classname", "<", field("type", $._type), ">"),

    variable: (_) => token(seq("$", IDENTIFIER)),
    identifier: ($) => choice($._identifier_token, "_", ...CONSTRUCT_NAMES),
    _local_identifier: ($) =>
      choice(
        alias($._identifier_token, $.identifier),
        ...CONSTRUCT_NAMES.map((name) => alias(name, $.identifier)),
      ),

    _name: ($) =>
      choice($._local_identifier, $.qualified_name, $.fully_qualified_name),
    _identifier_name: ($) =>
      choice($.identifier, $.qualified_name, $.fully_qualified_name),

    namespace_name: ($) =>
      choice(
        $._local_identifier,
        $.qualified_namespace_name,
        $.fully_qualified_namespace_name,
      ),

    qualified_namespace_name: ($) =>
      seq(
        alias($._namespace_name_segment_continuing_token, $.identifier),
        repeat(
          seq(
            $._name_separator,
            alias($._namespace_name_segment_continuing_token, $.identifier),
          ),
        ),
        $._name_separator,
        $._immediate_namespace_name_segment,
      ),

    fully_qualified_namespace_name: ($) =>
      seq(
        $._name_separator,
        choice(
          $._immediate_namespace_name_segment,
          seq(
            alias($._namespace_name_segment_continuing_token, $.identifier),
            repeat(
              seq(
                $._name_separator,
                alias($._namespace_name_segment_continuing_token, $.identifier),
              ),
            ),
            $._name_separator,
            $._immediate_namespace_name_segment,
          ),
        ),
      ),

    qualified_name: ($) =>
      seq(
        alias(
          choice(
            $._name_segment_continuing_token,
            $._namespace_name_segment_continuing_token,
          ),
          $.identifier,
        ),
        repeat(
          seq(
            $._name_separator,
            alias(
              choice(
                $._name_segment_continuing_token,
                $._namespace_name_segment_continuing_token,
              ),
              $.identifier,
            ),
          ),
        ),
        $._name_separator,
        $._immediate_name_segment,
      ),

    fully_qualified_name: ($) =>
      seq(
        $._name_separator,
        choice(
          $._immediate_name_segment,
          seq(
            alias(
              choice(
                $._name_segment_continuing_token,
                $._namespace_name_segment_continuing_token,
              ),
              $.identifier,
            ),
            repeat(
              seq(
                $._name_separator,
                alias(
                  choice(
                    $._name_segment_continuing_token,
                    $._namespace_name_segment_continuing_token,
                  ),
                  $.identifier,
                ),
              ),
            ),
            $._name_separator,
            $._immediate_name_segment,
          ),
        ),
      ),

    _immediate_name_segment: ($) =>
      alias(token.immediate(IDENTIFIER), $.identifier),
    _immediate_namespace_name_segment: ($) =>
      alias(token.immediate(NON_WILDCARD_IDENTIFIER), $.identifier),

    function_name: ($) =>
      choice($._local_identifier, ...SOFT_KEYWORDS, ...CONTEXTUAL_KEYWORDS),
    _soft_function_name: ($) =>
      alias(choice(...SOFT_KEYWORDS), $.function_name),
    constant_name: ($) => choice($._local_identifier, ...CONTEXTUAL_KEYWORDS),
    member_name: ($) => choice($._local_identifier, ...KEYWORDS),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function construct(name, contents = null) {
  return prec(
    PREC.POSTFIX,
    seq(name, "!", "(", ...(contents === null ? [] : [contents]), ")"),
  );
}

function unaryConstruct($, name, valueField) {
  return construct(name, seq(field(valueField, $._expression), optional(",")));
}

function binaryConstruct($, name, leftField, rightField) {
  return construct(
    name,
    seq(
      field(leftField, $._expression),
      ",",
      field(rightField, $._expression),
      optional(","),
    ),
  );
}

function variadicConstruct($, name) {
  return construct(
    name,
    optional(seq(commaSep1($.construct_argument), optional(","))),
  );
}

function literalStringConstruct($, name, valueField) {
  return construct(
    name,
    seq(field(valueField, $.string_literal), optional(",")),
  );
}
