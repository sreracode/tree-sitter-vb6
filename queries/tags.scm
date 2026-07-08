(sub_declaration
  name: (identifier) @name) @definition.function

(function_declaration
  name: (identifier) @name) @definition.function

(property_get_declaration
  name: (identifier) @name) @definition.method

(property_set_declaration
  name: (identifier) @name) @definition.method

(property_let_declaration
  name: (identifier) @name) @definition.method

(type_declaration
  name: (identifier) @name) @definition.class

(enum_declaration
  name: (identifier) @name) @definition.enum

(enum_member
  name: (identifier) @name) @definition.constant

(event_declaration
  name: (identifier) @name) @definition.event

(const_declaration
  (const_declarator
    name: (identifier) @name)) @definition.constant

(label_statement
  name: (identifier) @name) @definition.label
