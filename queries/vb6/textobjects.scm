; VB6 text objects for nvim-treesitter-textobjects

; ── Functions / Subs ──────────────────────────────────────────────────────────

(sub_declaration) @function.outer
(sub_declaration body: (block) @function.inner)

(function_declaration) @function.outer
(function_declaration body: (block) @function.inner)

; ── Properties ────────────────────────────────────────────────────────────────

(property_get_declaration) @function.outer
(property_get_declaration body: (block) @function.inner)

(property_set_declaration) @function.outer
(property_set_declaration body: (block) @function.inner)

(property_let_declaration) @function.outer
(property_let_declaration body: (block) @function.inner)

; ── Classes / Types ───────────────────────────────────────────────────────────

(type_declaration) @class.outer
(type_declaration
  (type_member) @class.inner)

(enum_declaration) @class.outer
(enum_declaration
  (enum_member) @class.inner)

; ── Parameters ────────────────────────────────────────────────────────────────

(parameter_list
  (parameter) @parameter.inner) @parameter.outer

(parameter) @parameter.inner

; ── Conditionals ──────────────────────────────────────────────────────────────

(block_if_statement) @conditional.outer
(block_if_statement consequence: (block) @conditional.inner)

(inline_if_statement) @conditional.outer

; ── Loops ─────────────────────────────────────────────────────────────────────

(for_next_statement) @loop.outer
(for_next_statement body: (block) @loop.inner)

(for_each_statement) @loop.outer
(for_each_statement body: (block) @loop.inner)

(while_statement) @loop.outer
(while_statement body: (block) @loop.inner)

(do_loop_statement) @loop.outer
(do_loop_statement body: (block) @loop.inner)

; ── Calls ─────────────────────────────────────────────────────────────────────

(call_expression
  (argument_list) @call.inner) @call.outer

(call_statement) @call.outer

; ── Comments ──────────────────────────────────────────────────────────────────

(comment) @comment.outer
