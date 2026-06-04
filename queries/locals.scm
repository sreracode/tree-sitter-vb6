; Scope definitions
(sub_declaration) @local.scope
(function_declaration) @local.scope
(property_get_declaration) @local.scope
(property_set_declaration) @local.scope
(property_let_declaration) @local.scope

; Definitions
(sub_declaration name: (identifier) @local.definition)
(function_declaration name: (identifier) @local.definition)
(variable_declarator name: (identifier) @local.definition)
(parameter name: (identifier) @local.definition)
(const_declarator name: (identifier) @local.definition)

; References
(identifier) @local.reference
