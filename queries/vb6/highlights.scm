; ─── Declarations ───────────────────────────────────────────────────────────────

(sub_declaration name: (identifier) @function)
(function_declaration name: (identifier) @function)
(property_get_declaration name: (identifier) @function)
(property_set_declaration name: (identifier) @function)
(property_let_declaration name: (identifier) @function)

; ─── Types ──────────────────────────────────────────────────────────────────────

(type_declaration name: (identifier) @type)
(enum_declaration name: (identifier) @type)
(type_expression) @type

; Built-in primitive types (override @type for better precision)
(type_expression [
  "boolean" "byte" "integer" "long" "single" "double" "currency"
  "date" "string" "object" "variant" "any"
] @type.builtin)

; ─── Variables ──────────────────────────────────────────────────────────────────

(variable_declarator name: (identifier) @variable)
(parameter name: (identifier) @variable.parameter)

; ─── Literals ───────────────────────────────────────────────────────────────────

(string_literal) @string
(integer_literal) @number
(float_literal) @number
(boolean_literal) @constant.builtin
(date_literal) @string.special
["nothing" "empty" "null"] @constant.builtin

; ─── Labels ─────────────────────────────────────────────────────────────────────

(label_statement name: (identifier) @label)

; ─── Operators ──────────────────────────────────────────────────────────────────

(binary_expression operator: _ @operator)
(unary_expression operator: _ @operator)

["and" "or" "not" "xor" "is" "like" "mod" "eqv" "imp"] @keyword.operator

; ─── Punctuation ────────────────────────────────────────────────────────────────

["(" ")"] @punctuation.bracket
["," "."] @punctuation.delimiter
(compiler_directive "#" @keyword.directive)
(file_number_expression "#" @punctuation.special)

; ─── Comments ───────────────────────────────────────────────────────────────────

(comment) @comment

; ─── Module metadata ────────────────────────────────────────────────────────────

(attribute_statement) @attribute
(module_header) @keyword.import

; ─── Keywords — procedure & module declarations ──────────────────────────────────

[
  "sub" "function" "property" "get" "set" "let"
  "end" "declare" "event" "implements" "lib" "alias"
] @keyword.function

["type" "enum"] @keyword.type

; ─── Keywords — storage & modifiers ─────────────────────────────────────────────

[
  "public" "private" "friend" "static"
  "withevents"
] @keyword.modifier

["byval" "byref" "optional" "paramarray"] @keyword.modifier

; ─── Keywords — variable / const declarations ────────────────────────────────────

["dim" "const" "redim" "preserve" "as" "new"] @keyword

; ─── Keywords — DefType ──────────────────────────────────────────────────────────

[
  "defbool" "defbyte" "defint" "deflng" "defcur"
  "defsng" "defdbl" "defdec" "defdate"
  "defstr" "defobj" "defvar"
] @keyword

; ─── Keywords — control flow ─────────────────────────────────────────────────────

[
  "if" "then" "elseif" "else"
  "select" "case"
  "for" "each" "in" "next" "to" "step"
  "while" "wend"
  "do" "loop" "until"
  "with"
  "goto" "gosub" "return"
  "on" "error" "local"
] @keyword.control

["exit" "resume"] @keyword.return

; ─── Keywords — object / built-in statement heads ────────────────────────────────

[
  "call" "raiseevent" "addressof" "typeof"
  "set" "let"
] @keyword

; File I/O
[
  "open" "close" "print" "write" "input" "get" "put" "seek"
  "lock" "unlock" "reset" "line"
  "append" "binary" "output" "random" "access" "shared" "read"
] @keyword

; File-system
["kill" "name" "chdir" "chdrive" "mkdir" "rmdir" "filecopy"] @keyword

; Date / time
["date" "time"] @keyword

; UI / environment
["load" "unload" "sendkeys" "appactivate" "savesetting" "deletesetting"] @keyword

; Misc statements
["beep" "stop" "error" "randomize" "erase"] @keyword
["mid" "midb" "lset" "rset"] @keyword
["debug" "assert"] @keyword

; Print formatting built-ins
["spc" "tab"] @function.builtin

; ─── Keywords — options & module-level attributes ────────────────────────────────

["option" "explicit" "base" "compare" "module"] @keyword
["text" "binary"] @keyword
["version" "class" "object" "begin" "attribute"] @keyword
