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
    // foo = ... could be assignment or call_statement with no keyword
    [$.call_statement, $.assignment_statement],
    // foo: could be label or call/assignment starting with identifier
    [$.assignment_statement, $.label_statement],
    [$.call_statement, $.label_statement],
    // Static Foo ... could be sub_declaration or dim_statement
    [$.sub_declaration, $.dim_statement],
    // member_access_expression could be start of call_statement or expression
    [$.expression, $.call_statement],
    // block repeat ambiguity
    [$.block],
    // On Error GoTo conflicts with On expr GoTo (on_goto uses expr which can be Error-as-identifier)
    [$.on_error_statement, $._ambiguous_identifier],
    // print_statement has optional file_number prefix which conflicts with output_list
    [$.print_statement, $.output_item],
    // label_statement: identifier ':' vs identifier followed by ':' as terminator
    [$.label_statement, $._terminator],
    // inline_if vs block_if: 'If expr Then' could start either
    [$.inline_if_statement, $.block_if_statement],
    // case_condition vs expression overlap
    [$.case_condition, $.expression],
    // new_expression vs expression ambiguity in with_statement (With New ...)
    [$.expression, $.new_expression],
    // inline_statement has member_access_expression overlapping with expression
    [$.expression, $.inline_statement],
    // else_clause body is optional, causing ambiguity at end of block
    [$.else_clause],
    // case_else_clause body is optional, causing ambiguity at end of block
    [$.case_else_clause],
    // case_clause body is optional, causing ambiguity at end of block
    [$.case_clause],
    // elseif_clause body is optional, causing ambiguity at end of block
    [$.elseif_clause],
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

    statement: $ => choice(
      $.assignment_statement,
      $.let_statement,
      $.set_statement,
      $.call_statement,
      $.dim_statement,
      $.redim_statement,
      $.const_statement,
      $.if_statement,
      $.select_case_statement,
      $.for_next_statement,
      $.for_each_statement,
      $.while_statement,
      $.do_loop_statement,
      $.with_statement,
      $.goto_statement,
      $.gosub_statement,
      $.return_statement,
      $.on_error_statement,
      $.on_goto_statement,
      $.on_gosub_statement,
      $.resume_statement,
      $.exit_statement,
      $.label_statement,
      $.raise_event_statement,
      $.mid_statement,
      $.lset_statement,
      $.rset_statement,
      $.open_statement,
      $.close_statement,
      $.print_statement,
      $.write_statement,
      $.input_statement,
      $.line_input_statement,
      $.get_statement,
      $.put_statement,
      $.seek_statement,
      $.beep_statement,
      $.stop_statement,
      $.end_statement,
      $.kill_statement,
      $.name_statement,
      $.chdir_statement,
      $.chdrive_statement,
      $.mkdir_statement,
      $.rmdir_statement,
      $.filecopy_statement,
      $.date_statement,
      $.time_statement,
      $.load_statement,
      $.unload_statement,
      $.randomize_statement,
      $.erase_statement,
      $.lock_statement,
      $.unlock_statement,
      $.send_keys_statement,
      $.app_activate_statement,
      $.save_setting_statement,
      $.delete_setting_statement,
      $.error_statement,
      $.reset_statement,
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

    call_expression: $ => prec(10, seq(
      field('function', $.expression),
      '(',
      optional(field('arguments', $.argument_list)),
      ')',
    )),

    argument_list: $ => commaSep1($.argument),

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

    let_statement: $ => seq(
      kw('Let'),
      field('target', $._left_hand_side),
      '=',
      field('value', $.expression),
      $._terminator,
    ),

    call_statement: $ => choice(
      seq(kw('Call'), field('call', $.expression), $._terminator),
      seq(
        field('call', choice($.member_access_expression, $._ambiguous_identifier)),
        optional(field('arguments', $.argument_list_no_parens)),
        $._terminator,
      ),
    ),

    argument_list_no_parens: $ => commaSep1($.argument),

    const_statement: $ => seq(
      kw('Const'),
      commaSep1($.const_declarator),
      $._terminator,
    ),

    redim_statement: $ => seq(
      kw('ReDim'),
      optional(kw('Preserve')),
      commaSep1($.redim_declarator),
      $._terminator,
    ),

    redim_declarator: $ => seq(
      field('name', $._ambiguous_identifier),
      optional($.type_hint),
      '(',
      field('dimensions', $.subscripts),
      ')',
      optional(seq(kw('As'), field('type', $.type_expression))),
    ),

    exit_statement: $ => seq(
      kw('Exit'),
      choice(kw('Sub'), kw('Function'), kw('Property'), kw('For'), kw('Do')),
      $._terminator,
    ),

    erase_statement: $ => seq(
      kw('Erase'),
      commaSep1(field('array', $._ambiguous_identifier)),
      $._terminator,
    ),

    randomize_statement: $ => seq(
      kw('Randomize'),
      optional(field('seed', $.expression)),
      $._terminator,
    ),

    raise_event_statement: $ => seq(
      kw('RaiseEvent'),
      field('event', $._ambiguous_identifier),
      optional(seq('(', optional($.argument_list), ')')),
      $._terminator,
    ),

    // ── If statement (Task 9) ──
    if_statement: $ => choice(
      $.inline_if_statement,
      $.block_if_statement,
    ),

    inline_if_statement: $ => prec(2, seq(
      kw('If'),
      field('condition', $.expression),
      kw('Then'),
      field('consequence', $.inline_statement),
      optional(seq(kw('Else'), field('alternative', $.inline_statement))),
      $._terminator,
    )),

    // inline_statement: no $._terminator (the inline_if_statement provides it)
    inline_statement: $ => choice(
      seq(kw('GoTo'), field('label', $._ambiguous_identifier)),
      seq(kw('GoSub'), field('label', $._ambiguous_identifier)),
      seq(kw('Return')),
      seq(kw('Exit'), choice(kw('Sub'), kw('Function'), kw('Property'), kw('For'), kw('Do'))),
      seq(kw('Resume'), optional(choice(kw('Next'), $._ambiguous_identifier))),
      seq(kw('Stop')),
      seq(kw('Beep')),
      seq(kw('End')),
      seq(kw('Set'), field('target', $._left_hand_side), '=', field('value', $.expression)),
      seq(kw('Let'), field('target', $._left_hand_side), '=', field('value', $.expression)),
      seq(field('target', $._left_hand_side), '=', field('value', $.expression)),
      seq(kw('Call'), $.expression),
      seq($.member_access_expression, optional($.argument_list_no_parens)),
      seq($._ambiguous_identifier, optional($.argument_list_no_parens)),
    ),

    block_if_statement: $ => seq(
      kw('If'),
      field('condition', $.expression),
      kw('Then'),
      $._terminator,
      field('consequence', optional($.block)),
      repeat($.elseif_clause),
      optional($.else_clause),
      kw('End'), kw('If'),
      $._terminator,
    ),

    elseif_clause: $ => seq(
      choice(kw('ElseIf'), seq(kw('Else'), kw('If'))),
      field('condition', $.expression),
      kw('Then'),
      $._terminator,
      field('body', optional($.block)),
    ),

    else_clause: $ => seq(
      kw('Else'),
      $._terminator,
      field('body', optional($.block)),
    ),

    // ── Select Case statement (Task 9) ──
    select_case_statement: $ => seq(
      kw('Select'), kw('Case'),
      field('value', $.expression),
      $._terminator,
      repeat(choice($.case_clause, $.case_else_clause)),
      kw('End'), kw('Select'),
      $._terminator,
    ),

    case_clause: $ => seq(
      kw('Case'),
      commaSep1($.case_condition),
      $._terminator,
      field('body', optional($.block)),
    ),

    case_else_clause: $ => seq(
      kw('Case'), kw('Else'),
      $._terminator,
      field('body', optional($.block)),
    ),

    case_condition: $ => choice(
      seq(kw('Is'), choice('=', '<>', '<', '>', '<=', '>='), $.expression),
      seq($.expression, kw('To'), $.expression),
      $.expression,
    ),

    // ── For Next statement (Task 9) ──
    for_next_statement: $ => seq(
      kw('For'),
      field('variable', $._ambiguous_identifier),
      optional($.type_hint),
      '=',
      field('from', $.expression),
      kw('To'),
      field('to', $.expression),
      optional(seq(kw('Step'), field('step', $.expression))),
      $._terminator,
      field('body', optional($.block)),
      kw('Next'),
      optional(field('next_variable', $._ambiguous_identifier)),
      $._terminator,
    ),

    // ── For Each statement (Task 9) ──
    for_each_statement: $ => seq(
      kw('For'), kw('Each'),
      field('variable', $._ambiguous_identifier),
      optional($.type_hint),
      kw('In'),
      field('collection', $.expression),
      $._terminator,
      field('body', optional($.block)),
      kw('Next'),
      optional(field('next_variable', $._ambiguous_identifier)),
      $._terminator,
    ),

    // ── While Wend statement (Task 9) ──
    while_statement: $ => seq(
      kw('While'),
      field('condition', $.expression),
      $._terminator,
      field('body', optional($.block)),
      kw('Wend'),
      $._terminator,
    ),

    // ── Do Loop statement (Task 9) ──
    do_loop_statement: $ => choice(
      seq(kw('Do'), $._terminator, field('body', optional($.block)), kw('Loop'), $._terminator),
      seq(kw('Do'), choice(kw('While'), kw('Until')), field('condition', $.expression), $._terminator, field('body', optional($.block)), kw('Loop'), $._terminator),
      seq(kw('Do'), $._terminator, field('body', optional($.block)), kw('Loop'), choice(kw('While'), kw('Until')), field('condition', $.expression), $._terminator),
    ),

    // ── With statement (Task 9) ──
    with_statement: $ => seq(
      kw('With'),
      field('object', $.expression),
      $._terminator,
      field('body', optional($.block)),
      kw('End'), kw('With'),
      $._terminator,
    ),
    goto_statement: $ => seq(kw('GoTo'), field('label', $._ambiguous_identifier), $._terminator),
    gosub_statement: $ => seq(kw('GoSub'), field('label', $._ambiguous_identifier), $._terminator),
    return_statement: $ => seq(kw('Return'), $._terminator),
    on_error_statement: $ => seq(kw('On'), kw('Error'), kw('GoTo'), $._ambiguous_identifier, $._terminator),
    on_goto_statement: $ => seq(kw('On'), $.expression, kw('GoTo'), commaSep1($._ambiguous_identifier), $._terminator),
    on_gosub_statement: $ => seq(kw('On'), $.expression, kw('GoSub'), commaSep1($._ambiguous_identifier), $._terminator),
    resume_statement: $ => seq(kw('Resume'), optional(choice(kw('Next'), $._ambiguous_identifier)), $._terminator),
    label_statement: $ => seq(field('name', $._ambiguous_identifier), ':', $._terminator),
    mid_statement: $ => prec(2, seq(kw('Mid'), '(', $.expression, ',', $.expression, optional(seq(',', $.expression)), ')', '=', $.expression, $._terminator)),
    lset_statement: $ => seq(kw('LSet'), field('target', $._left_hand_side), '=', field('value', $.expression), $._terminator),
    rset_statement: $ => seq(kw('RSet'), field('target', $._left_hand_side), '=', field('value', $.expression), $._terminator),
    open_statement: $ => prec(2, seq(kw('Open'), $.expression, kw('For'), choice(kw('Append'), kw('Binary'), kw('Input'), kw('Output'), kw('Random')), optional(seq(kw('Access'), choice(kw('Read'), kw('Write'), seq(kw('Read'), kw('Write'))))), kw('As'), optional('#'), field('file_number', $.expression), optional(seq(kw('Len'), '=', field('record_length', $.expression))), $._terminator)),
    close_statement: $ => prec(2, seq(kw('Close'), commaSep(seq(optional('#'), $.expression)), $._terminator)),
    print_statement: $ => seq(kw('Print'), optional(seq(optional('#'), $.expression, ',')), optional($.output_list), $._terminator),
    write_statement: $ => seq(kw('Write'), optional('#'), $.expression, ',', optional($.output_list), $._terminator),
    input_statement: $ => prec(2, seq(kw('Input'), optional('#'), $.expression, repeat1(seq(',', field('variable', $._ambiguous_identifier))), $._terminator)),
    line_input_statement: $ => seq(kw('Line'), kw('Input'), optional('#'), $.expression, ',', field('variable', $._ambiguous_identifier), $._terminator),
    get_statement: $ => seq(kw('Get'), optional('#'), $.expression, ',', optional($.expression), ',', field('variable', $.expression), $._terminator),
    put_statement: $ => seq(kw('Put'), optional('#'), $.expression, ',', optional($.expression), ',', field('data', $.expression), $._terminator),
    seek_statement: $ => seq(kw('Seek'), optional('#'), $.expression, ',', field('position', $.expression), $._terminator),
    beep_statement: $ => seq(kw('Beep'), $._terminator),
    stop_statement: $ => seq(kw('Stop'), $._terminator),
    end_statement: $ => seq(kw('End'), $._terminator),
    kill_statement: $ => seq(kw('Kill'), field('path', $.expression), $._terminator),
    name_statement: $ => prec(2, seq(kw('Name'), field('old_path', $.expression), kw('As'), field('new_path', $.expression), $._terminator)),
    chdir_statement: $ => seq(kw('ChDir'), field('path', $.expression), $._terminator),
    chdrive_statement: $ => seq(kw('ChDrive'), field('drive', $.expression), $._terminator),
    mkdir_statement: $ => seq(kw('MkDir'), field('path', $.expression), $._terminator),
    rmdir_statement: $ => seq(kw('RmDir'), field('path', $.expression), $._terminator),
    filecopy_statement: $ => seq(kw('FileCopy'), field('source', $.expression), ',', field('destination', $.expression), $._terminator),
    date_statement: $ => prec(2, seq(kw('Date'), '=', field('value', $.expression), $._terminator)),
    time_statement: $ => prec(2, seq(kw('Time'), '=', field('value', $.expression), $._terminator)),
    load_statement: $ => seq(kw('Load'), field('object', $.expression), $._terminator),
    unload_statement: $ => seq(kw('Unload'), field('object', $.expression), $._terminator),
    send_keys_statement: $ => seq(kw('SendKeys'), field('keys', $.expression), optional(seq(',', field('wait', $.expression))), $._terminator),
    app_activate_statement: $ => seq(kw('AppActivate'), field('title', $.expression), optional(seq(',', field('wait', $.expression))), $._terminator),
    save_setting_statement: $ => seq(kw('SaveSetting'), field('app', $.expression), ',', field('section', $.expression), ',', field('key', $.expression), ',', field('setting', $.expression), $._terminator),
    delete_setting_statement: $ => seq(kw('DeleteSetting'), field('app', $.expression), ',', field('section', $.expression), optional(seq(',', field('key', $.expression))), $._terminator),
    error_statement: $ => prec(2, seq(kw('Error'), field('number', $.expression), $._terminator)),
    reset_statement: $ => prec(2, seq(kw('Reset'), $._terminator)),

    output_list: $ => seq(
      $.output_item,
      repeat(seq(choice(';', ','), optional($.output_item))),
    ),

    output_item: $ => choice(
      seq(choice(kw('Spc'), kw('Tab')), '(', $.expression, ')'),
      $.expression,
    ),

    lock_statement: $ => seq(kw('Lock'), optional('#'), $.expression, optional(seq(',', optional(seq($.expression, kw('To'))), $.expression)), $._terminator),
    unlock_statement: $ => seq(kw('Unlock'), optional('#'), $.expression, optional(seq(',', optional(seq($.expression, kw('To'))), $.expression)), $._terminator),

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
      optional(kw('WithEvents')),
      commaSep1($.variable_declarator),
      $._terminator,
    ),

    variable_declarator: $ => seq(
      field('name', $._ambiguous_identifier),
      optional($.type_hint),
      optional(seq('(', optional($.subscripts), ')')),
      optional(seq(kw('As'), optional(kw('New')), field('type', $.type_expression))),
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
