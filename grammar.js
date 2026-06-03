/**
 * @file Tree-sitter grammar for Visual Basic 6.0
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'vb6',

  word: $ => $.identifier,

  extras: $ => [
    $.comment,
    /[ \t\f ]+/,
    $._line_continuation,
  ],

  conflicts: $ => [],

  rules: {
    source_file: $ => seq(
      optional($.module_header),
      repeat($.attribute_statement),
      optional($.module_options),
      optional($.module_body),
    ),

    // Placeholder — replaced in Task 3
    module_header: $ => seq(kw('VERSION'), $._terminator),
    attribute_statement: $ => seq(kw('Attribute'), $._terminator),
    module_options: $ => seq(kw('Option'), kw('Explicit'), $._terminator),
    module_body: $ => seq($.identifier, $._terminator),

    identifier: $ => token(/[A-Za-z_][A-Za-z_0-9]*[$%&!#@]?/),

    comment: $ => token(choice(
      seq("'", /.*/),
      /[Rr][Ee][Mm]([ \t].*)?\r?\n?/,
    )),

    _line_continuation: $ => token(seq('_', /[ \t]*/, /\r?\n/)),
    _newline: $ => /\r?\n/,
    _terminator: $ => choice($._newline, ':'),
  },
});

// ──────────────── helpers ────────────────

function kw(word) {
  return token(prec(1, ci(word)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function ci(keyword) {
  return new RegExp(
    keyword.split('').map(ch =>
      /[A-Za-z]/.test(ch) ? `[${ch.toLowerCase()}${ch.toUpperCase()}]`
                           : ch.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    ).join('')
  );
}
