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
    // _newline appears in both source_file (leading blank lines) and
    // module_body (blank lines between declarations), causing ambiguity.
    [$.source_file, $.module_body],
    // type_expression ends with _ambiguous_identifier, causing ambiguity
    // when parsing type annotations vs bare identifiers.
    [$.type_expression, $._ambiguous_identifier],
    // dim_statement uses Public/Private as leading tokens; visibility also
    // matches those tokens, so the parser needs a GLR split.
    [$.visibility, $.dim_statement],
    // expression and _left_hand_side both match _ambiguous_identifier.
    [$.expression, $._left_hand_side],
    // call_expression and index_expression both match expr '(' ... ')'.
    [$.call_expression, $.index_expression],
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

    // ── Visibility ──
    visibility: $ => choice(kw('Public'), kw('Private'), kw('Friend')),

    // ── Sub and Function declarations ──
    sub_declaration: $ => seq(
      optional($.visibility),
      optional(kw('Static')),
      kw('Sub'),
      field('name', $._ambiguous_identifier),
      field('parameters', $.parameter_list),
      $._terminator,
      optional(field('body', $.block)),
      kw('End'), kw('Sub'),
      $._terminator,
    ),

    function_declaration: $ => seq(
      optional($.visibility),
      optional(kw('Static')),
      kw('Function'),
      field('name', $._ambiguous_identifier),
      field('parameters', $.parameter_list),
      optional(seq(kw('As'), field('return_type', $.type_expression))),
      $._terminator,
      optional(field('body', $.block)),
      kw('End'), kw('Function'),
      $._terminator,
    ),

    parameter_list: $ => seq('(', commaSep($.parameter), ')'),

    parameter: $ => seq(
      optional(kw('Optional')),
      optional($.modifier),
      field('name', $._ambiguous_identifier),
      optional($.type_hint),
      optional(seq('(', optional($.subscripts), ')')),
      optional(seq(kw('As'), optional(kw('New')), field('type', $.type_expression))),
      optional(seq('=', field('default', $.expression))),
    ),

    modifier: $ => choice(kw('ByVal'), kw('ByRef'), kw('ParamArray')),

    type_expression: $ => choice(
      kw('Boolean'), kw('Byte'),    kw('Integer'), kw('Long'),
      kw('Single'),  kw('Double'),  kw('Currency'), kw('Date'),
      kw('String'),  kw('Object'),  kw('Variant'),  kw('Any'),
      seq(kw('String'), '*', choice($.integer_literal, $.identifier)),
      $._ambiguous_identifier,
    ),

    type_hint: $ => /[$%&!#@]/,

    block: $ => repeat1(choice($.statement, $._newline)),

    // Placeholder statement — expanded in Task 8
    statement: $ => choice(
      $.dim_statement,
      $.assignment_statement,
      $.set_statement,
    ),

    subscripts: $ => commaSep1($.subscript),
    subscript: $ => seq(
      optional(seq($.expression, kw('To'))),
      $.expression,
    ),

    // ── Full expression hierarchy ──
    expression: $ => choice(
      $.literal,
      $.new_expression,
      $.typeof_is_expression,
      $.addressof_expression,
      $.parenthesized_expression,
      $.unary_expression,
      $.binary_expression,
      $.member_access_expression,
      $.index_expression,
      $.call_expression,
      $._ambiguous_identifier,
    ),

    new_expression: $ => seq(
      kw('New'),
      field('type', $._ambiguous_identifier),
    ),

    typeof_is_expression: $ => prec.right(1, seq(
      kw('TypeOf'),
      field('object', $.expression),
      kw('Is'),
      field('type', $._ambiguous_identifier),
    )),

    addressof_expression: $ => prec.right(0, seq(
      kw('AddressOf'),
      field('procedure', $.expression),
    )),

    parenthesized_expression: $ => seq('(', $.expression, ')'),

    unary_expression: $ => prec(8, seq(
      field('operator', choice(kw('Not'), '-', '+')),
      field('operand', $.expression),
    )),

    binary_expression: $ => {
      const table = [
        [7,  '^'],
        [6,  choice('*', '/', '\\', kw('Mod'))],
        [5,  choice('+', '-')],
        [4,  '&'],
        [3,  choice('=', '<>', '<', '>', '<=', '>=', kw('Is'), kw('Like'))],
        [2,  kw('And')],
        [1,  choice(kw('Or'), kw('Xor'))],
        [0,  choice(kw('Eqv'), kw('Imp'))],
      ];
      return choice(...table.map(([precedence, op]) =>
        prec.left(precedence, seq(
          field('left', $.expression),
          field('operator', op),
          field('right', $.expression),
        ))
      ));
    },

    member_access_expression: $ => prec.left(10, seq(
      field('object', $.expression),
      '.',
      field('name', $._ambiguous_identifier),
    )),

    index_expression: $ => prec(9, seq(
      field('object', $.expression),
      '(',
      commaSep1($.argument),
      ')',
    )),

    call_expression: $ => prec(9, seq(
      field('function', $.expression),
      '(',
      optional(commaSep($.argument)),
      ')',
    )),

    argument_list: $ => commaSep($.argument),

    argument: $ => choice(
      // Named argument: foo := expr
      seq(field('keyword', $.identifier), ':=', optional(field('value', $.expression))),
      // Positional with modifier: ByVal expr or ByRef expr
      seq(choice(kw('ByVal'), kw('ByRef')), field('value', $.expression)),
      // Plain expression
      field('value', $.expression),
    ),

    _left_hand_side: $ => choice(
      $.member_access_expression,
      $.index_expression,
      $._ambiguous_identifier,
    ),

    // ── Assignment and Set statements ──
    assignment_statement: $ => seq(
      field('target', $._left_hand_side),
      '=',
      field('value', $.expression),
      $._terminator,
    ),

    set_statement: $ => seq(
      kw('Set'),
      field('target', $._left_hand_side),
      '=',
      field('value', $.expression),
      $._terminator,
    ),

    // ── Property declarations (Task 5) ──
    property_get_declaration: $ => seq(
      optional($.visibility),
      optional(kw('Static')),
      kw('Property'), kw('Get'),
      field('name', $._ambiguous_identifier),
      optional($.type_hint),
      field('parameters', $.parameter_list),
      optional(seq(kw('As'), field('return_type', $.type_expression))),
      $._terminator,
      optional(field('body', $.block)),
      kw('End'), kw('Property'),
      $._terminator,
    ),

    property_set_declaration: $ => seq(
      optional($.visibility),
      optional(kw('Static')),
      kw('Property'), kw('Set'),
      field('name', $._ambiguous_identifier),
      field('parameters', $.parameter_list),
      $._terminator,
      optional(field('body', $.block)),
      kw('End'), kw('Property'),
      $._terminator,
    ),

    property_let_declaration: $ => seq(
      optional($.visibility),
      optional(kw('Static')),
      kw('Property'), kw('Let'),
      field('name', $._ambiguous_identifier),
      field('parameters', $.parameter_list),
      $._terminator,
      optional(field('body', $.block)),
      kw('End'), kw('Property'),
      $._terminator,
    ),

    // ── Remaining module-level declarations (Task 6) ──
    declare_declaration: $ => seq(
      optional($.visibility),
      kw('Declare'),
      choice(kw('Function'), kw('Sub')),
      field('name', $._ambiguous_identifier),
      optional($.type_hint),
      kw('Lib'),
      field('library', $.string_literal),
      optional(seq(kw('Alias'), field('alias', $.string_literal))),
      field('parameters', $.parameter_list),
      optional(seq(kw('As'), field('return_type', $.type_expression))),
      $._terminator,
    ),

    type_declaration: $ => seq(
      optional($.visibility),
      kw('Type'),
      field('name', $._ambiguous_identifier),
      $._terminator,
      repeat1($.type_member),
      kw('End'), kw('Type'),
      $._terminator,
    ),

    type_member: $ => seq(
      field('name', $._ambiguous_identifier),
      optional(seq('(', optional($.subscripts), ')')),
      kw('As'),
      field('type', $.type_expression),
      $._terminator,
    ),

    enum_declaration: $ => seq(
      optional($.visibility),
      kw('Enum'),
      field('name', $._ambiguous_identifier),
      $._terminator,
      repeat1($.enum_member),
      kw('End'), kw('Enum'),
      $._terminator,
    ),

    enum_member: $ => seq(
      field('name', $._ambiguous_identifier),
      optional(seq('=', field('value', $.expression))),
      $._terminator,
    ),

    event_declaration: $ => seq(
      optional($.visibility),
      kw('Event'),
      field('name', $._ambiguous_identifier),
      field('parameters', $.parameter_list),
      $._terminator,
    ),

    const_declaration: $ => seq(
      optional($.visibility),
      kw('Const'),
      commaSep1($.const_declarator),
      $._terminator,
    ),

    const_declarator: $ => seq(
      field('name', $._ambiguous_identifier),
      optional($.type_hint),
      optional(seq(kw('As'), field('type', $.type_expression))),
      '=',
      field('value', $.expression),
    ),

    deftype_declaration: $ => seq(
      choice(
        kw('DefBool'), kw('DefByte'), kw('DefInt'),  kw('DefLng'),
        kw('DefCur'),  kw('DefSng'),  kw('DefDbl'),  kw('DefDec'),
        kw('DefDate'), kw('DefStr'),  kw('DefObj'),  kw('DefVar'),
      ),
      commaSep1($.deftype_range),
      $._terminator,
    ),

    deftype_range: $ => seq(
      $.identifier,
      optional(seq('-', $.identifier)),
    ),

    implements_declaration: $ => seq(
      kw('Implements'),
      field('interface', $._ambiguous_identifier),
      $._terminator,
    ),

    dim_statement: $ => seq(
      choice(kw('Dim'), kw('Static'), kw('Public'), kw('Private')),
      field('name', $._ambiguous_identifier),
      optional($.type_hint),
      optional(seq('(', optional($.subscripts), ')')),
      optional(seq(kw('As'), optional(kw('New')), field('type', $.type_expression))),
      $._terminator,
    ),

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
