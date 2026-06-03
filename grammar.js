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

  conflicts: $ => [
    [$.source_file, $.module_body],
  ],

  rules: {
    source_file: $ => seq(
      repeat($._newline),
      optional($.module_header),
      repeat($.attribute_statement),
      optional($.module_options),
      optional($.module_body),
    ),

    module_header: $ => seq(
      kw('VERSION'),
      $.float_literal,
      optional(kw('CLASS')),
      $._terminator,
      optional($.module_config),
    ),

    module_config: $ => seq(
      kw('BEGIN'),
      $._terminator,
      repeat($.module_config_element),
      kw('END'),
      $._terminator,
    ),

    module_config_element: $ => seq(
      field('name', $._ambiguous_identifier),
      '=',
      field('value', $.literal),
      $._terminator,
    ),

    attribute_statement: $ => seq(
      kw('Attribute'),
      field('name', $.dotted_name),
      '=',
      field('value', $.literal),
      $._terminator,
    ),

    dotted_name: $ => seq(
      $.identifier,
      repeat(seq('.', $.identifier)),
    ),

    module_options: $ => repeat1(
      seq(
        choice(
          seq(kw('Option'), kw('Explicit')),
          seq(kw('Option'), kw('Base'), /[01]/),
          seq(kw('Option'), kw('Compare'), choice(kw('Binary'), kw('Text'))),
          seq(kw('Option'), kw('Private'), kw('Module')),
        ),
        $._terminator,
      )
    ),

    module_body: $ => repeat1(
      choice(
        $.sub_declaration,
        $.function_declaration,
        $.property_get_declaration,
        $.property_set_declaration,
        $.property_let_declaration,
        $.declare_declaration,
        $.type_declaration,
        $.enum_declaration,
        $.event_declaration,
        $.const_declaration,
        $.dim_statement,
        $.deftype_declaration,
        $.implements_declaration,
        $._newline,
      )
    ),

    // ── Placeholder declarations (replaced in Tasks 4-6) ──
    sub_declaration: $ => seq(kw('Sub'), field('name', $.identifier), '(', ')', $._terminator, kw('End'), kw('Sub'), $._terminator),
    function_declaration: $ => seq(kw('Function'), field('name', $.identifier), '(', ')', $._terminator, kw('End'), kw('Function'), $._terminator),
    property_get_declaration: $ => seq(kw('Property'), kw('Get'), field('name', $.identifier), '(', ')', $._terminator, kw('End'), kw('Property'), $._terminator),
    property_set_declaration: $ => seq(kw('Property'), kw('Set'), field('name', $.identifier), '(', ')', $._terminator, kw('End'), kw('Property'), $._terminator),
    property_let_declaration: $ => seq(kw('Property'), kw('Let'), field('name', $.identifier), '(', ')', $._terminator, kw('End'), kw('Property'), $._terminator),
    declare_declaration: $ => seq(kw('Declare'), kw('Sub'), field('name', $.identifier), kw('Lib'), $.string_literal, '(', ')', $._terminator),
    type_declaration: $ => seq(kw('Type'), field('name', $.identifier), $._terminator, kw('End'), kw('Type'), $._terminator),
    enum_declaration: $ => seq(kw('Enum'), field('name', $.identifier), $._terminator, kw('End'), kw('Enum'), $._terminator),
    event_declaration: $ => seq(kw('Event'), field('name', $.identifier), '(', ')', $._terminator),
    const_declaration: $ => seq(kw('Const'), field('name', $.identifier), '=', $.integer_literal, $._terminator),
    dim_statement: $ => seq(kw('Dim'), field('name', $.identifier), $._terminator),
    deftype_declaration: $ => seq(kw('DefInt'), /[A-Za-z]/, $._terminator),
    implements_declaration: $ => seq(kw('Implements'), field('interface', $.identifier), $._terminator),

    // ── Literals ──
    literal: $ => choice(
      $.boolean_literal,
      $.integer_literal,
      $.float_literal,
      $.string_literal,
      $.date_literal,
      kw('Nothing'),
      kw('Empty'),
      kw('Null'),
    ),

    boolean_literal: $ => token(choice(
      /[Tt][Rr][Uu][Ee]/,
      /[Ff][Aa][Ll][Ss][Ee]/,
    )),

    integer_literal: $ => token(choice(
      /\d+[%&]?/,
      /&[Hh][0-9A-Fa-f]+[%&]?/,
      /&[Oo][0-7]+[%&]?/,
    )),

    float_literal: $ => token(choice(
      /\d+\.\d*([Ee][+-]?\d+)?[!#@]?/,
      /\.\d+([Ee][+-]?\d+)?[!#@]?/,
      /\d+[Ee][+-]?\d+[!#@]?/,
      /\d+[!#@]/,
    )),

    string_literal: $ => token(seq('"', repeat(choice(/[^"\r\n]/, '""')), '"')),

    date_literal: $ => token(seq('#', /[^#\r\n]+/, '#')),

    // ── ambiguous identifier: identifier OR keyword-as-identifier ──
    _ambiguous_identifier: $ => choice(
      $.identifier,
      alias(kw('Name'),  $.identifier),
      alias(kw('Date'),  $.identifier),
      alias(kw('Time'),  $.identifier),
      alias(kw('Error'), $.identifier),
      alias(kw('Input'), $.identifier),
      alias(kw('Left'),  $.identifier),
      alias(kw('Right'), $.identifier),
      alias(kw('Mid'),   $.identifier),
      alias(kw('Open'),  $.identifier),
      alias(kw('Close'), $.identifier),
      alias(kw('Reset'), $.identifier),
      alias(kw('Width'), $.identifier),
      alias(kw('Type'),  $.identifier),
      alias(kw('Enum'),  $.identifier),
      alias(kw('Event'), $.identifier),
    ),

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
