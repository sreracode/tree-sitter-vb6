; Declarations
(sub_declaration name: (identifier) @function)
(function_declaration name: (identifier) @function)
(property_get_declaration name: (identifier) @function)
(property_set_declaration name: (identifier) @function)
(property_let_declaration name: (identifier) @function)

; Types
(type_expression) @type
(type_declaration name: (identifier) @type)
(enum_declaration name: (identifier) @type)

; Variables
(variable_declarator name: (identifier) @variable)
(parameter name: (identifier) @variable.parameter)

; Literals
(string_literal) @string
(integer_literal) @number
(float_literal) @number
(boolean_literal) @constant.builtin
(date_literal) @string.special

; Labels
(label_statement name: (identifier) @label)

; Comments
(comment) @comment

; Module metadata
(attribute_statement) @attribute
(module_header) @keyword.import
