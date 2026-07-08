; VB6 indentation queries (nvim-treesitter format)

; ── Block openers ─────────────────────────────────────────────────────────────
; These nodes open an indented scope.

[
  (sub_declaration)
  (function_declaration)
  (property_get_declaration)
  (property_set_declaration)
  (property_let_declaration)
  (type_declaration)
  (enum_declaration)
  (block_if_statement)
  (for_next_statement)
  (for_each_statement)
  (while_statement)
  (do_loop_statement)
  (with_statement)
  (select_case_statement)
  (compiler_directive)
] @indent.begin

; Case clauses also open an indented scope for their body
(case_clause) @indent.begin
(case_else_clause) @indent.begin

; ── Block closers ─────────────────────────────────────────────────────────────
; "end" as a *direct* child of its enclosing block node (not end_statement
; nested inside a body), so we target each parent explicitly.

(sub_declaration "end" @indent.end)
(function_declaration "end" @indent.end)
(property_get_declaration "end" @indent.end)
(property_set_declaration "end" @indent.end)
(property_let_declaration "end" @indent.end)
(type_declaration "end" @indent.end)
(enum_declaration "end" @indent.end)
(block_if_statement "end" @indent.end)
(with_statement "end" @indent.end)
(select_case_statement "end" @indent.end)

; Loop-specific closers (these keywords only appear in their respective loops)
(while_statement "wend" @indent.end)
(do_loop_statement "loop" @indent.end)
(for_next_statement "next" @indent.end)
(for_each_statement "next" @indent.end)

; ── Branches ──────────────────────────────────────────────────────────────────
; These nodes sit at the same level as the opening keyword (not the body level).

(else_clause) @indent.branch
(elseif_clause) @indent.branch
(case_clause) @indent.branch
(case_else_clause) @indent.branch
