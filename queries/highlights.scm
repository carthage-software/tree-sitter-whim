; Comments

(shebang) @comment
(line_comment) @comment
(block_comment) @comment
(documentation_comment) @comment.documentation

; Keywords, operators, and punctuation

[
  "namespace"
  "use"
  "as"
  "const"
  "type"
  "newtype"
  "function"
  "fn"
  "class"
  "interface"
  "enum"
  "extends"
  "implements"
  "for"
  "case"
  "abstract"
  "final"
  "readonly"
  "public"
  "protected"
  "private"
  "static"
  "in"
  "out"
  "if"
  "else"
  "while"
  "do"
  "foreach"
  "using"
  "try"
  "catch"
  "finally"
  "match"
  "new"
  "break"
  "continue"
  "return"
  "throw"
  "self"
  "parent"
  "default"
] @keyword

[
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "**="
  ".="
  "&="
  "|="
  "^="
  "<<="
  ">>="
  "??="
  "&&="
  "||="
  "??"
  "||"
  "&&"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "<=>"
  "is"
  "|>"
  "."
  "|"
  "^"
  "&"
  "<<"
  ">>"
  "+"
  "-"
  "*"
  "/"
  "%"
  "**"
  "!"
  "~"
  "++"
  "--"
  "?"
  "@"
  "=>"
  "->"
  "?->"
  "::"
  "::<"
  ".."
  "..="
  "..."
] @operator

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ";"
  ":"
  "#["
] @punctuation.delimiter

; Literals and strings

(integer_literal) @number
(float_literal) @number
(boolean_literal) @boolean
(null_literal) @constant.builtin

(single_quoted_string) @string
(double_quoted_string) @string
(interpolated_string) @string
(single_quoted_escape_sequence) @string.escape
(double_quoted_escape_sequence) @string.escape
(variable_interpolation) @embedded
(braced_interpolation) @embedded

; Variables

(variable) @variable
(parameter name: (variable) @variable.parameter)
(property_declaration name: (variable) @property)
(static_property_access_expression property: (variable) @property)

; Namespaces and imports

(namespace_definition name: (_) @module)
(use_group prefix: (_) @module)
(use_item name: (_) @module)
(use_alias name: (identifier) @module)

; Types and type declarations

[
  (primitive_type)
  (wildcard_type)
] @type.builtin

(array_type "array" @type.builtin)
(vector_type "vec" @type.builtin)
(vector_shape_type "vec" @type.builtin)
(dictionary_type "dict" @type.builtin)
(dictionary_shape_type "dict" @type.builtin)
(classname_type "classname" @type.builtin)
(self_type "self" @type.builtin)
(parent_type) @type.builtin
(static_type) @type.builtin

(named_type name: (_) @type)
(member_type name: (identifier) @type)
(type_parameter name: (identifier) @type.parameter)

(type_alias_declaration name: (identifier) @type)
(newtype_declaration name: (identifier) @type)
(class_declaration name: (identifier) @type)
(interface_declaration name: (identifier) @type)
(enum_declaration name: (identifier) @type)

(extends_clause type: (named_type name: (_) @type))
(implements_clause type: (named_type name: (_) @type))
(sealed_permissions type: (_) @type)

(object_creation_expression
  class: [
    (identifier)
    (qualified_name)
    (fully_qualified_name)
  ] @type)

[
  (static_method_call_expression
    class: (constant_access_expression) @type)
  (static_method_partial_application_expression
    class: (constant_access_expression) @type)
  (static_property_access_expression
    class: (constant_access_expression) @type)
  (class_constant_access_expression
    class: (constant_access_expression) @type)
]

; Constants, enum cases, and attributes

(constant_declaration name: (constant_name) @constant)
(class_constant_declaration name: (member_name) @constant)
(enum_case_declaration name: (member_name) @constant)
(class_constant_access_expression constant: (member_name) @constant)
(constant_access_expression name: (_) @constant)
(attribute name: (_) @attribute)
(named_argument name: (member_name) @variable.parameter)
(named_placeholder_argument name: (member_name) @variable.parameter)
(clone_field name: (member_name) @property)

; Declarations and calls

(function_declaration name: (function_name) @function)
(method_declaration name: (member_name) @function.method)

(function_call_expression
  function: (function_name) @function.call)
(function_call_expression
  function: (constant_access_expression) @function.call)
(function_call_expression
  function: (variable) @function.call)
(function_partial_application_expression
  function: (function_name) @function.call)
(function_partial_application_expression
  function: (constant_access_expression) @function.call)
(function_partial_application_expression
  function: (variable) @function.call)

(method_call_expression method: (member_name) @function.method.call)
(method_partial_application_expression method: (member_name) @function.method.call)
(null_safe_method_call_expression method: (member_name) @function.method.call)
(static_method_call_expression method: (member_name) @function.method.call)
(static_method_partial_application_expression
  method: (member_name) @function.method.call)

(property_access_expression property: (member_name) @property)
(null_safe_property_access_expression property: (member_name) @property)

; Language constructs

(require_construct "require" @function.macro)
(require_once_construct "require_once" @function.macro)
(length_construct "length" @function.macro)
(contains_construct "contains" @function.macro)
(contains_key_construct "contains_key" @function.macro)
(clone_construct "clone" @function.macro)
(remove_construct "remove" @function.macro)
(swap_remove_construct "swap_remove" @function.macro)
(remove_first_construct "remove_first" @function.macro)
(remove_last_construct "remove_last" @function.macro)
(assert_construct "assert" @function.macro)
(exit_construct "exit" @function.macro)
(panic_construct "panic" @function.macro)
(write_construct "write" @function.macro)
(write_line_construct "write_line" @function.macro)
(write_error_construct "write_error" @function.macro)
(write_error_line_construct "write_error_line" @function.macro)
(debug_construct "debug" @function.macro)
(discard_construct "discard" @function.macro)
(drop_construct "drop" @function.macro)
(file_construct "file" @function.macro)
(directory_construct "directory" @function.macro)
(embed_construct "embed" @function.macro)
