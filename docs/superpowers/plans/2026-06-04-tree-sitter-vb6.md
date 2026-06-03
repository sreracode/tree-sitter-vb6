# tree-sitter-vb6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tree-sitter parser for Visual Basic 6.0 targeting static analysis and migration tooling, by combining tree-sitter-vb6's project scaffold with a fresh grammar derived from the proleap VB6 ANTLR4 grammar.

**Architecture:** Copy non-generated scaffold files from `../tree-sitter-vb6/` and rename all `vb6` identifiers to `vb6`. Write `grammar.js` from scratch using `../proleap-vb6-parser/src/main/antlr4/io/proleap/vb6/VisualBasic6.g4` as the language spec. Build incrementally: add grammar rules, generate parser, add corpus test, verify green, commit.

**Tech Stack:** tree-sitter-cli ^0.25.x, Node.js ≥18, grammar.js (tree-sitter PEG DSL), C compiler for `src/parser.c` generation.

**Reference paths** (absolute, used throughout this plan):
- `DOTNET=/Users/asteroid/Code/tree-sitter-vb6`
- `VB6=/Users/asteroid/Code/tree-sitter-vb6`
- `PROLEAP=/Users/asteroid/Code/proleap-vb6-parser`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `grammar.js` | Create fresh | Single source: all VB6 grammar rules |
| `tree-sitter.json` | Copy + rename | Language metadata |
| `package.json` | Copy + rename | npm package + devDeps |
| `binding.gyp` | Copy + rename | Node.js native binding config |
| `Cargo.toml` | Copy + rename | Rust binding config |
| `CMakeLists.txt` | Copy + rename | C/C++ build config |
| `pyproject.toml` | Copy + rename | Python binding config |
| `setup.py` | Copy + rename | Python setup |
| `Package.swift` | Copy + rename | Swift binding config |
| `go.mod` | Copy + rename | Go module config |
| `Makefile` | Copy + rename | Build shortcuts |
| `bindings/` | Copy + rename | Language binding implementations |
| `src/` | **Generated** by `tree-sitter generate` | C parser — do not edit |
| `test/corpus/module.txt` | Create | Module header, attributes, options tests |
| `test/corpus/declarations.txt` | Create | Sub, Function, Property, Type, Enum tests |
| `test/corpus/statements.txt` | Create | Block statement tests |
| `test/corpus/expressions.txt` | Create | Literal and expression tests |
| `queries/highlights.scm` | Create | Syntax highlighting queries (stub) |
| `queries/locals.scm` | Create | Scope/locals queries (stub) |

---

## Task 1: Copy and rename scaffold from tree-sitter-vb6

**Files:**
- Create: all project config files (package.json, Cargo.toml, etc.)
- Create: `bindings/` directory

- [ ] **Step 1: Copy non-generated files**

```bash
DOTNET=/Users/asteroid/Code/tree-sitter-vb6
VB6=/Users/asteroid/Code/tree-sitter-vb6

cp -r $DOTNET/bindings $VB6/
cp $DOTNET/binding.gyp $VB6/
cp $DOTNET/Cargo.toml $VB6/
cp $DOTNET/CMakeLists.txt $VB6/
cp $DOTNET/Makefile $VB6/
cp $DOTNET/package.json $VB6/
cp $DOTNET/pyproject.toml $VB6/
cp $DOTNET/setup.py $VB6/
cp $DOTNET/Package.swift $VB6/
cp $DOTNET/go.mod $VB6/
cp $DOTNET/tree-sitter.json $VB6/
cp $DOTNET/.editorconfig $VB6/ 2>/dev/null || true
cp $DOTNET/.gitignore $VB6/
cp $DOTNET/.gitattributes $VB6/
# Do NOT copy grammar.js (write fresh) or src/ (generated)
```

- [ ] **Step 2: Rename all vb6 identifiers to vb6**

```bash
VB6=/Users/asteroid/Code/tree-sitter-vb6

# Rename all string occurrences in file contents
find $VB6 -type f -not -path '*/.git/*' | xargs grep -l "vb.dotnet\|vb6\|Vb6\|TreeSitterVb6\|tree-sitter-vb6\|VB\.NET\|vb6" | while read f; do
  sed -i '' \
    -e 's/tree-sitter-vb6/tree-sitter-vb6/g' \
    -e 's/tree_sitter_vb6/tree_sitter_vb6/g' \
    -e 's/vb6/vb6/g' \
    -e 's/Vb6/Vb6/g' \
    -e 's/TreeSitterVb6/TreeSitterVb6/g' \
    -e 's/VB\.NET/VB6/g' \
    -e 's/vb6/vb6/g' \
    "$f"
done
```

- [ ] **Step 3: Rename files that have the language name in their filename**

```bash
VB6=/Users/asteroid/Code/tree-sitter-vb6

# Rename node binding file if it has the language name
find $VB6/bindings -name "*vb6*" -o -name "*vb6*" | while read f; do
  newf=$(echo "$f" | sed -e 's/vb6/vb6/g' -e 's/vb6/vb6/g')
  mv "$f" "$newf"
done
```

- [ ] **Step 4: Update tree-sitter.json manually for correct file types**

Edit `$VB6/tree-sitter.json` so that the grammar entry reads:
```json
{
  "$schema": "https://tree-sitter.github.io/tree-sitter/assets/schemas/config.schema.json",
  "grammars": [
    {
      "name": "vb6",
      "camelcase": "Vb6",
      "title": "VB6",
      "scope": "source.vb6",
      "file-types": ["bas", "cls"],
      "injection-regex": "^vb6$",
      "class-name": "TreeSitterVb6"
    }
  ],
  "metadata": {
    "version": "0.1.0",
    "license": "MIT",
    "description": "Tree-sitter grammar for Visual Basic 6.0",
    "authors": [
      { "name": "Your Name", "email": "you@example.com" }
    ],
    "links": {
      "repository": "https://github.com/your-org/tree-sitter-vb6"
    }
  },
  "bindings": {
    "c": true, "go": true, "node": true,
    "python": true, "rust": true, "swift": true, "zig": false
  }
}
```

- [ ] **Step 5: Create queries stubs and test corpus directory**

```bash
VB6=/Users/asteroid/Code/tree-sitter-vb6
mkdir -p $VB6/queries $VB6/test/corpus
touch $VB6/queries/highlights.scm $VB6/queries/locals.scm
```

- [ ] **Step 6: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add -A
git commit -m "feat: copy and rename scaffold from tree-sitter-vb6"
```

---

## Task 2: Grammar skeleton with helpers

**Files:**
- Create: `grammar.js`

- [ ] **Step 1: Create grammar.js with helpers and minimal skeleton**

Create `/Users/asteroid/Code/tree-sitter-vb6/grammar.js` with this content:

```javascript
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
    /[ \t\f ]+/,
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
      seq(/[Rr][Ee][Mm](?=\s|$)/, /.*/),
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
```

- [ ] **Step 2: Install dependencies and verify generate works**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npm install
npx tree-sitter generate
```

Expected: `src/parser.c` and `src/grammar.json` created. No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js src/ package-lock.json node_modules/.package-lock.json
git commit -m "feat: add grammar skeleton and verify tree-sitter generate"
```

---

## Task 3: Module structure rules

**Files:**
- Modify: `grammar.js` (replace placeholder rules, add real ones)
- Create: `test/corpus/module.txt`

- [ ] **Step 1: Write corpus test first (expect fail)**

Create `test/corpus/module.txt`:

```
================================================================================
Module header for class module
================================================================================

VERSION 1.0 CLASS

--------------------------------------------------------------------------------

(source_file
  (module_header))

================================================================================
Attribute statement
================================================================================

Attribute VB_Name = "MyClass"

--------------------------------------------------------------------------------

(source_file
  (attribute_statement
    name: (dotted_name
      (identifier))
    value: (string_literal)))

================================================================================
Option Explicit
================================================================================

Option Explicit

--------------------------------------------------------------------------------

(source_file
  (module_options))

================================================================================
Hello World class module
================================================================================

VERSION 1.0 CLASS
Attribute VB_Name = "Class1"
Option Explicit

--------------------------------------------------------------------------------

(source_file
  (module_header)
  (attribute_statement
    name: (dotted_name
      (identifier))
    value: (string_literal))
  (module_options))
```

- [ ] **Step 2: Run test (expect fail)**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "Module header"
```

Expected: FAIL — placeholder rules don't match yet.

- [ ] **Step 3: Replace placeholder rules with real module structure rules**

In `grammar.js`, inside `rules: { ... }`, replace the four placeholder rules with:

```javascript
    source_file: $ => seq(
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

    // Placeholder — replaced in Task 4
    sub_declaration: $ => seq(kw('Sub'), $.identifier, $._terminator, kw('End'), kw('Sub'), $._terminator),
    function_declaration: $ => seq(kw('Function'), $.identifier, $._terminator, kw('End'), kw('Function'), $._terminator),
    property_get_declaration: $ => seq(kw('Property'), kw('Get'), $.identifier, $._terminator, kw('End'), kw('Property'), $._terminator),
    property_set_declaration: $ => seq(kw('Property'), kw('Set'), $.identifier, $._terminator, kw('End'), kw('Property'), $._terminator),
    property_let_declaration: $ => seq(kw('Property'), kw('Let'), $.identifier, $._terminator, kw('End'), kw('Property'), $._terminator),
    declare_declaration: $ => seq(kw('Declare'), $._terminator),
    type_declaration: $ => seq(kw('Type'), $.identifier, $._terminator, kw('End'), kw('Type'), $._terminator),
    enum_declaration: $ => seq(kw('Enum'), $.identifier, $._terminator, kw('End'), kw('Enum'), $._terminator),
    event_declaration: $ => seq(kw('Event'), $.identifier, $._terminator),
    const_declaration: $ => seq(kw('Const'), $.identifier, '=', $.integer_literal, $._terminator),
    dim_statement: $ => seq(kw('Dim'), $.identifier, $._terminator),
    deftype_declaration: $ => seq(kw('DefInt'), /[A-Za-z]/, $._terminator),
    implements_declaration: $ => seq(kw('Implements'), $.identifier, $._terminator),

    // Literals needed by attribute_statement
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

    boolean_literal: $ => token(choice(kw('True'), kw('False'))),

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

    // ambiguous identifier: identifier OR a keyword used as identifier
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
```

Also add these at the bottom of the `rules` object (they are used above):

```javascript
    identifier: $ => token(/[A-Za-z_][A-Za-z_0-9]*[$%&!#@]?/),

    comment: $ => token(choice(
      seq("'", /.*/),
      seq(/[Rr][Ee][Mm](?=\s|$)/, /.*/),
    )),

    _line_continuation: $ => token(seq('_', /[ \t]*/, /\r?\n/)),
    _newline: $ => /\r?\n/,
    _terminator: $ => choice($._newline, ':'),
```

- [ ] **Step 4: Generate and run tests**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test
```

Expected: corpus tests in `module.txt` pass. Fix any parse errors by adjusting expected trees (use `npx tree-sitter parse test/corpus/module.txt` to see actual tree output).

- [ ] **Step 5: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js test/corpus/module.txt src/
git commit -m "feat: add module structure rules and corpus tests"
```

---

## Task 4: Sub and Function declarations

**Files:**
- Modify: `grammar.js` (replace sub/function placeholders)
- Modify: `test/corpus/declarations.txt` (create and add cases)

- [ ] **Step 1: Write corpus test**

Create `test/corpus/declarations.txt`:

```
================================================================================
Empty Sub declaration
================================================================================

Sub Main()
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list))))

================================================================================
Private Sub with parameters
================================================================================

Private Sub Command1_Click()
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      (visibility)
      name: (identifier)
      parameters: (parameter_list))))

================================================================================
Function with return type
================================================================================

Function Add(ByVal a As Integer, ByVal b As Integer) As Integer
End Function

--------------------------------------------------------------------------------

(source_file
  (module_body
    (function_declaration
      name: (identifier)
      parameters: (parameter_list
        (parameter
          (modifier)
          name: (identifier)
          type: (type_expression))
        (parameter
          (modifier)
          name: (identifier)
          type: (type_expression)))
      return_type: (type_expression))))

================================================================================
Static Sub
================================================================================

Static Sub Timer1_Timer()
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list))))
```

- [ ] **Step 2: Run test (expect fail)**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "Empty Sub"
```

- [ ] **Step 3: Replace sub_declaration and function_declaration placeholders**

In `grammar.js` rules, replace the placeholder `sub_declaration` and `function_declaration` with:

```javascript
    visibility: $ => choice(kw('Public'), kw('Private'), kw('Friend')),

    sub_declaration: $ => seq(
      optional($.visibility),
      optional(kw('Static')),
      kw('Sub'),
      field('name', $._ambiguous_identifier),
      field('parameters', $.parameter_list),
      $._terminator,
      field('body', $.block),
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
      field('body', $.block),
      kw('End'), kw('Function'),
      $._terminator,
    ),

    parameter_list: $ => seq('(', commaSep($.parameter), ')'),

    parameter: $ => seq(
      optional(kw('Optional')),
      optional(field('modifier', choice(kw('ByVal'), kw('ByRef'), kw('ParamArray')))),
      field('name', $._ambiguous_identifier),
      optional($.type_hint),
      optional(seq('(', optional($.subscripts), ')')),
      optional(seq(kw('As'), optional(kw('New')), field('type', $.type_expression))),
      optional(seq('=', field('default', $.expression))),
    ),

    modifier: $ => choice(kw('ByVal'), kw('ByRef'), kw('ParamArray')),

    type_expression: $ => choice(
      kw('Boolean'), kw('Byte'),   kw('Integer'), kw('Long'),
      kw('Single'),  kw('Double'), kw('Currency'), kw('Date'),
      kw('String'),  kw('Object'), kw('Variant'),  kw('Any'),
      seq(kw('String'), '*', choice($.integer_literal, $.identifier)),
      $._ambiguous_identifier,
    ),

    type_hint: $ => /[$%&!#@]/,

    block: $ => repeat(choice($.statement, $._newline)),

    // Placeholder statement — replaced in Task 8
    statement: $ => seq($.identifier, $._terminator),

    subscripts: $ => commaSep1($.subscript),
    subscript: $ => seq(
      optional(seq($.expression, kw('To'))),
      $.expression,
    ),

    // Placeholder expression — replaced in Task 9
    expression: $ => choice($.literal, $.identifier),
```

**Note on `modifier` field**: The `parameter` rule has `optional(field('modifier', choice(...)))`. Keep it as `optional(choice(...))` wrapped in `optional()`. The field label on modifier is optional — use `optional($.modifier)` where `modifier` is defined as a rule above.

Simplify parameter to avoid the nested choice problem:

```javascript
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
```

- [ ] **Step 4: Generate and run tests**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "declarations"
```

Expected: sub/function tests pass. If `(visibility)` node appears but isn't expected, remove the `(visibility)` line from tests where there's no visibility keyword. If `(block)` appears in expected tree for empty body, add it. Adjust expected trees to match actual output of `npx tree-sitter parse`.

- [ ] **Step 5: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js test/corpus/declarations.txt src/
git commit -m "feat: add sub and function declarations"
```

---

## Task 5: Property declarations

**Files:**
- Modify: `grammar.js`
- Modify: `test/corpus/declarations.txt`

- [ ] **Step 1: Append corpus tests**

Append to `test/corpus/declarations.txt`:

```
================================================================================
Property Get declaration
================================================================================

Property Get PenColor() As String
End Property

--------------------------------------------------------------------------------

(source_file
  (module_body
    (property_get_declaration
      name: (identifier)
      parameters: (parameter_list)
      return_type: (type_expression))))

================================================================================
Property Let declaration
================================================================================

Property Let PenColor(ByVal vNewValue As String)
End Property

--------------------------------------------------------------------------------

(source_file
  (module_body
    (property_let_declaration
      name: (identifier)
      parameters: (parameter_list
        (parameter
          (modifier)
          name: (identifier)
          type: (type_expression))))))

================================================================================
Property Set declaration
================================================================================

Property Set MyObject(ByVal vNewObj As Object)
End Property

--------------------------------------------------------------------------------

(source_file
  (module_body
    (property_set_declaration
      name: (identifier)
      parameters: (parameter_list
        (parameter
          (modifier)
          name: (identifier)
          type: (type_expression))))))
```

- [ ] **Step 2: Replace property declaration placeholders**

In `grammar.js` rules, replace the three property placeholder rules with:

```javascript
    property_get_declaration: $ => seq(
      optional($.visibility),
      optional(kw('Static')),
      kw('Property'), kw('Get'),
      field('name', $._ambiguous_identifier),
      optional($.type_hint),
      field('parameters', $.parameter_list),
      optional(seq(kw('As'), field('return_type', $.type_expression))),
      $._terminator,
      field('body', $.block),
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
      field('body', $.block),
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
      field('body', $.block),
      kw('End'), kw('Property'),
      $._terminator,
    ),
```

- [ ] **Step 3: Generate and run tests**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "Property"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js test/corpus/declarations.txt src/
git commit -m "feat: add property declarations"
```

---

## Task 6: Type, Enum, Declare, Event, DefType, Implements, Const declarations

**Files:**
- Modify: `grammar.js`
- Modify: `test/corpus/declarations.txt`

- [ ] **Step 1: Append corpus tests**

Append to `test/corpus/declarations.txt` (source from `$PROLEAP/src/test/resources/com/microsoft/msdn/statements/`):

```
================================================================================
Type declaration
================================================================================

Type Employee
    Name As String * 20
    ID As Integer
End Type

--------------------------------------------------------------------------------

(source_file
  (module_body
    (type_declaration
      name: (identifier)
      (type_member
        name: (identifier)
        type: (type_expression))
      (type_member
        name: (identifier)
        type: (type_expression)))))

================================================================================
Enum declaration
================================================================================

Public Enum InterfaceColors
    icMistyRose = &HE1E4FF&
    icSlateGray = &H908070&
End Enum

--------------------------------------------------------------------------------

(source_file
  (module_body
    (enum_declaration
      (visibility)
      name: (identifier)
      (enum_member
        name: (identifier)
        value: (integer_literal))
      (enum_member
        name: (identifier)
        value: (integer_literal)))))

================================================================================
Declare Sub
================================================================================

Declare Sub MessageBeep Lib "User32" (ByVal N As Long)

--------------------------------------------------------------------------------

(source_file
  (module_body
    (declare_declaration
      name: (identifier)
      library: (string_literal)
      parameters: (parameter_list
        (parameter
          (modifier)
          name: (identifier)
          type: (type_expression))))))

================================================================================
Implements declaration
================================================================================

Implements IAnimal

--------------------------------------------------------------------------------

(source_file
  (module_body
    (implements_declaration
      interface: (identifier))))

================================================================================
Module-level Const declaration
================================================================================

Public Const MAX_SIZE As Integer = 100

--------------------------------------------------------------------------------

(source_file
  (module_body
    (const_declaration
      (visibility)
      (const_declarator
        name: (identifier)
        type: (type_expression)
        value: (integer_literal)))))

================================================================================
DefInt declaration
================================================================================

DefInt A-Z

--------------------------------------------------------------------------------

(source_file
  (module_body
    (deftype_declaration
      (deftype_range))))
```

- [ ] **Step 2: Replace remaining module-level declaration placeholders**

In `grammar.js` rules, replace the placeholder rules for `declare_declaration`, `type_declaration`, `enum_declaration`, `event_declaration`, `const_declaration`, `dim_statement`, `deftype_declaration`, `implements_declaration`:

```javascript
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
      /[A-Za-z]/,
      optional(seq('-', /[A-Za-z]/)),
    ),

    implements_declaration: $ => seq(
      kw('Implements'),
      field('interface', $._ambiguous_identifier),
      $._terminator,
    ),
```

- [ ] **Step 3: Generate and run tests**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "declarations"
```

If conflicts are reported by `tree-sitter generate`, add the conflicting rule pairs to `conflicts: $ => [ [...] ]`. Use `npx tree-sitter parse` on failing test inputs to see actual tree.

- [ ] **Step 4: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js test/corpus/declarations.txt src/
git commit -m "feat: add type, enum, declare, event, deftype, implements, const declarations"
```

---

## Task 7: Expressions

**Files:**
- Modify: `grammar.js` (replace expression placeholder)
- Create: `test/corpus/expressions.txt`

- [ ] **Step 1: Write corpus test**

Create `test/corpus/expressions.txt`:

```
================================================================================
String literal
================================================================================

Sub Main()
    x = "hello"
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (assignment_statement
          target: (identifier)
          value: (string_literal))))))

================================================================================
Integer literal
================================================================================

Sub Main()
    x = 42
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (assignment_statement
          target: (identifier)
          value: (integer_literal))))))

================================================================================
Member access expression
================================================================================

Sub Main()
    x = Text1.Text
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (assignment_statement
          target: (identifier)
          value: (member_access_expression
            object: (identifier)
            name: (identifier)))))))

================================================================================
Call expression
================================================================================

Sub Main()
    x = Len("hello")
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (assignment_statement
          target: (identifier)
          value: (call_expression
            function: (identifier)
            arguments: (argument_list
              (argument
                value: (string_literal)))))))))

================================================================================
Binary expression addition
================================================================================

Sub Main()
    x = a + b
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (assignment_statement
          target: (identifier)
          value: (binary_expression
            left: (identifier)
            operator: (identifier)
            right: (identifier)))))))

================================================================================
Unary Not expression
================================================================================

Sub Main()
    x = Not flag
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (assignment_statement
          target: (identifier)
          value: (unary_expression
            operand: (identifier)))))))
```

- [ ] **Step 2: Run test (expect fail)**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "String literal"
```

- [ ] **Step 3: Replace expression placeholder with full expression hierarchy**

In `grammar.js`, replace `expression: $ => choice($.literal, $.identifier)` with the full expression rules. Also, replace `statement: $ => seq($.identifier, $._terminator)` with a placeholder `assignment_statement` (real statement rules come in Task 8):

```javascript
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

    typeof_is_expression: $ => seq(
      kw('TypeOf'),
      field('object', $.expression),
      kw('Is'),
      field('type', $._ambiguous_identifier),
    ),

    addressof_expression: $ => seq(
      kw('AddressOf'),
      field('procedure', $.expression),
    ),

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
      return choice(...table.map(([prec, op]) =>
        prec_left(prec, seq(
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
      field('indices', commaSep($.argument)),
      ')',
    )),

    call_expression: $ => prec(9, seq(
      field('function', $.expression),
      '(',
      field('arguments', $.argument_list),
      ')',
    )),

    argument_list: $ => commaSep($.argument),

    argument: $ => seq(
      optional(seq(field('name', $.identifier), ':=')),
      optional(choice(kw('ByVal'), kw('ByRef'))),
      optional(field('value', $.expression)),
    ),

    // left_hand_side: for assignment targets
    _left_hand_side: $ => choice(
      $.member_access_expression,
      $.index_expression,
      $.identifier,
    ),

    // Temporary statement placeholder — replace in Task 8
    statement: $ => $.assignment_statement,

    assignment_statement: $ => seq(
      field('target', $._left_hand_side),
      '=',
      field('value', $.expression),
      $._terminator,
    ),
```

**Note:** `prec_left` is not a built-in function — use `prec.left`. Change all occurrences in `binary_expression`:

```javascript
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
```

Also add `expression` and `_left_hand_side` to the `conflicts` array since they will conflict:

```javascript
  conflicts: $ => [
    [$.expression, $._left_hand_side],
    [$.call_expression, $.index_expression],
  ],
```

- [ ] **Step 4: Generate and run tests**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "expressions"
```

Adjust expected trees in `expressions.txt` to match actual output (especially `binary_expression` operator field — it may not be a named node if `+` is an anonymous token). Use `npx tree-sitter parse` to inspect.

- [ ] **Step 5: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js test/corpus/expressions.txt src/
git commit -m "feat: add full expression hierarchy"
```

---

## Task 8: Core block statements

**Files:**
- Modify: `grammar.js` (expand `statement` rule)
- Modify: `test/corpus/statements.txt` (create with core cases)

- [ ] **Step 1: Write core statement corpus tests**

Create `test/corpus/statements.txt`:

```
================================================================================
Dim statement
================================================================================

Sub Main()
    Dim x As Integer
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (dim_statement
          (variable_declarator
            name: (identifier)
            type: (type_expression)))))))

================================================================================
Const statement in block
================================================================================

Sub Main()
    Const MyVar = 459
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (const_statement
          (const_declarator
            name: (identifier)
            value: (integer_literal)))))))

================================================================================
Set statement
================================================================================

Sub Main()
    Set obj = New MyClass
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (set_statement
          target: (identifier)
          value: (new_expression
            type: (identifier)))))))

================================================================================
Explicit Let statement
================================================================================

Sub Main()
    Let x = 42
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (let_statement
          target: (identifier)
          value: (integer_literal))))))

================================================================================
Call statement with Call keyword
================================================================================

Sub Main()
    Call MsgBox("Hello")
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (call_statement
          (call_expression
            function: (identifier)
            arguments: (argument_list
              (argument
                value: (string_literal)))))))))

================================================================================
ReDim statement
================================================================================

Sub Main()
    ReDim Preserve arr(10)
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (redim_statement
          (redim_declarator
            name: (identifier)
            (subscripts
              (subscript
                (integer_literal)))))))))
```

- [ ] **Step 2: Expand `statement` rule with all core statements**

In `grammar.js`, replace `statement: $ => $.assignment_statement` with:

```javascript
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
```

Then add the core statement rules (keep `assignment_statement` from Task 7, add the others):

```javascript
    let_statement: $ => seq(
      kw('Let'),
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

    call_statement: $ => seq(
      choice(
        seq(kw('Call'), field('call', $.expression)),
        seq(
          field('call', choice(
            $.member_access_expression,
            $._ambiguous_identifier,
          )),
          optional(field('arguments', $.argument_list_no_parens)),
        ),
      ),
      $._terminator,
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

    // Placeholder rules for statements not yet implemented — replaced in Tasks 9-11
    if_statement: $ => seq(kw('If'), $.expression, kw('Then'), $._terminator, kw('End'), kw('If'), $._terminator),
    select_case_statement: $ => seq(kw('Select'), kw('Case'), $.expression, $._terminator, kw('End'), kw('Select'), $._terminator),
    for_next_statement: $ => seq(kw('For'), $.identifier, '=', $.expression, kw('To'), $.expression, $._terminator, kw('Next'), $._terminator),
    for_each_statement: $ => seq(kw('For'), kw('Each'), $.identifier, kw('In'), $.expression, $._terminator, kw('Next'), $._terminator),
    while_statement: $ => seq(kw('While'), $.expression, $._terminator, kw('Wend'), $._terminator),
    do_loop_statement: $ => seq(kw('Do'), $._terminator, kw('Loop'), $._terminator),
    with_statement: $ => seq(kw('With'), $.expression, $._terminator, kw('End'), kw('With'), $._terminator),
    goto_statement: $ => seq(kw('GoTo'), field('label', $.expression), $._terminator),
    gosub_statement: $ => seq(kw('GoSub'), field('label', $.expression), $._terminator),
    return_statement: $ => seq(kw('Return'), $._terminator),
    on_error_statement: $ => seq(kw('On'), kw('Error'), kw('GoTo'), $.expression, $._terminator),
    on_goto_statement: $ => seq(kw('On'), $.expression, kw('GoTo'), commaSep1($.expression), $._terminator),
    on_gosub_statement: $ => seq(kw('On'), $.expression, kw('GoSub'), commaSep1($.expression), $._terminator),
    resume_statement: $ => seq(kw('Resume'), $._terminator),
    label_statement: $ => seq(field('name', $._ambiguous_identifier), ':', $._terminator),
    mid_statement: $ => seq(kw('Mid'), '(', $.expression, ',', $.expression, optional(seq(',', $.expression)), ')', '=', $.expression, $._terminator),
    lset_statement: $ => seq(kw('LSet'), field('target', $._left_hand_side), '=', field('value', $.expression), $._terminator),
    rset_statement: $ => seq(kw('RSet'), field('target', $._left_hand_side), '=', field('value', $.expression), $._terminator),
    open_statement: $ => seq(kw('Open'), $.expression, kw('For'), choice(kw('Append'), kw('Binary'), kw('Input'), kw('Output'), kw('Random')), optional(seq(kw('Access'), choice(kw('Read'), kw('Write'), seq(kw('Read'), kw('Write'))))), kw('As'), optional('#'), field('file_number', $.expression), optional(seq(kw('Len'), '=', field('record_length', $.expression))), $._terminator),
    close_statement: $ => seq(kw('Close'), commaSep(seq(optional('#'), $.expression)), $._terminator),
    print_statement: $ => seq(kw('Print'), optional('#'), $.expression, ',', optional($.output_list), $._terminator),
    write_statement: $ => seq(kw('Write'), optional('#'), $.expression, ',', optional($.output_list), $._terminator),
    input_statement: $ => seq(kw('Input'), optional('#'), $.expression, repeat1(seq(',', field('variable', $._ambiguous_identifier))), $._terminator),
    line_input_statement: $ => seq(kw('Line'), kw('Input'), optional('#'), $.expression, ',', field('variable', $._ambiguous_identifier), $._terminator),
    get_statement: $ => seq(kw('Get'), optional('#'), $.expression, ',', optional($.expression), ',', field('variable', $.expression), $._terminator),
    put_statement: $ => seq(kw('Put'), optional('#'), $.expression, ',', optional($.expression), ',', field('data', $.expression), $._terminator),
    seek_statement: $ => seq(kw('Seek'), optional('#'), $.expression, ',', field('position', $.expression), $._terminator),
    beep_statement: $ => seq(kw('Beep'), $._terminator),
    stop_statement: $ => seq(kw('Stop'), $._terminator),
    end_statement: $ => seq(kw('End'), $._terminator),
    kill_statement: $ => seq(kw('Kill'), field('path', $.expression), $._terminator),
    name_statement: $ => seq(kw('Name'), field('old_path', $.expression), kw('As'), field('new_path', $.expression), $._terminator),
    chdir_statement: $ => seq(kw('ChDir'), field('path', $.expression), $._terminator),
    chdrive_statement: $ => seq(kw('ChDrive'), field('drive', $.expression), $._terminator),
    mkdir_statement: $ => seq(kw('MkDir'), field('path', $.expression), $._terminator),
    rmdir_statement: $ => seq(kw('RmDir'), field('path', $.expression), $._terminator),
    filecopy_statement: $ => seq(kw('FileCopy'), field('source', $.expression), ',', field('destination', $.expression), $._terminator),
    date_statement: $ => seq(kw('Date'), '=', field('value', $.expression), $._terminator),
    time_statement: $ => seq(kw('Time'), '=', field('value', $.expression), $._terminator),
    load_statement: $ => seq(kw('Load'), field('object', $.expression), $._terminator),
    unload_statement: $ => seq(kw('Unload'), field('object', $.expression), $._terminator),
    send_keys_statement: $ => seq(kw('SendKeys'), field('keys', $.expression), optional(seq(',', field('wait', $.expression))), $._terminator),
    app_activate_statement: $ => seq(kw('AppActivate'), field('title', $.expression), optional(seq(',', field('wait', $.expression))), $._terminator),
    save_setting_statement: $ => seq(kw('SaveSetting'), field('app', $.expression), ',', field('section', $.expression), ',', field('key', $.expression), ',', field('setting', $.expression), $._terminator),
    delete_setting_statement: $ => seq(kw('DeleteSetting'), field('app', $.expression), ',', field('section', $.expression), optional(seq(',', field('key', $.expression))), $._terminator),
    error_statement: $ => seq(kw('Error'), field('number', $.expression), $._terminator),
    reset_statement: $ => seq(kw('Reset'), $._terminator),

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
```

- [ ] **Step 3: Generate and run tests**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "statements"
```

Many conflicts are expected at this stage. Add conflict pairs to `conflicts` array as `tree-sitter generate` reports them. Common conflicts to expect:
- `[$.assignment_statement, $.label_statement]` — `foo:` is ambiguous
- `[$.call_statement, $.assignment_statement]` — `foo = ...` vs `Call foo`
- `[$.expression, $._left_hand_side]`

- [ ] **Step 4: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js test/corpus/statements.txt src/
git commit -m "feat: add core block statements"
```

---

## Task 9: If, Select Case, and loop statements

**Files:**
- Modify: `grammar.js` (replace if/select/loop placeholders)
- Modify: `test/corpus/statements.txt`

- [ ] **Step 1: Append corpus tests**

Append to `test/corpus/statements.txt`:

```
================================================================================
Multi-line If statement
================================================================================

Sub Main()
    If x > 0 Then
        y = 1
    ElseIf x < 0 Then
        y = -1
    Else
        y = 0
    End If
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (if_statement
          condition: (binary_expression
            left: (identifier)
            right: (integer_literal))
          consequence: (block
            (assignment_statement
              target: (identifier)
              value: (integer_literal)))
          (elseif_clause
            condition: (binary_expression
              left: (identifier)
              right: (integer_literal))
            body: (block
              (assignment_statement
                target: (identifier)
                value: (unary_expression
                  operand: (integer_literal)))))
          (else_clause
            body: (block
              (assignment_statement
                target: (identifier)
                value: (integer_literal))))))))))

================================================================================
Inline If statement
================================================================================

Sub Main()
    If Number = 1 Then GoTo Line1 Else GoTo Line2
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (inline_if_statement
          condition: (binary_expression
            left: (identifier)
            right: (integer_literal))
          consequence: (goto_statement
            label: (identifier))
          alternative: (goto_statement
            label: (identifier)))))))

================================================================================
Select Case statement
================================================================================

Sub Main()
    Select Case CurrentColor
        Case RED
            PenColor = "Red"
        Case GREEN, BLUE
            PenColor = "Other"
        Case Else
            PenColor = "Unknown"
    End Select
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (select_case_statement
          value: (identifier)
          (case_clause
            (case_condition
              (identifier)))
          (case_clause
            (case_condition
              (identifier))
            (case_condition
              (identifier)))
          (case_else_clause))))))

================================================================================
For Next statement
================================================================================

Sub Main()
    For I = 1 To 3 Step 1
        Beep
    Next I
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (for_next_statement
          variable: (identifier)
          from: (integer_literal)
          to: (integer_literal)
          step: (integer_literal)
          body: (block
            (beep_statement))
          next_variable: (identifier))))))

================================================================================
While Wend statement
================================================================================

Sub Main()
    While Counter < 20
        Counter = Counter + 1
    Wend
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (while_statement
          condition: (binary_expression
            left: (identifier)
            right: (integer_literal))
          body: (block
            (assignment_statement
              target: (identifier)
              value: (binary_expression
                left: (identifier)
                right: (integer_literal))))))))))

================================================================================
Do While Loop statement
================================================================================

Sub Main()
    Do While x < 10
        x = x + 1
    Loop
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (do_loop_statement
          condition: (binary_expression
            left: (identifier)
            right: (integer_literal))
          body: (block
            (assignment_statement
              target: (identifier)
              value: (binary_expression
                left: (identifier)
                right: (integer_literal))))))))))
```

- [ ] **Step 2: Replace if/select/loop placeholders with real rules**

In `grammar.js`, replace the placeholder rules with:

```javascript
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

    // inline_statement: statement without its own terminator
    inline_statement: $ => choice(
      $.goto_statement,
      $.gosub_statement,
      $.assignment_statement,
      $.call_statement,
      $.set_statement,
      $.let_statement,
      $.exit_statement,
      $.return_statement,
    ),

    block_if_statement: $ => seq(
      kw('If'),
      field('condition', $.expression),
      kw('Then'),
      $._terminator,
      field('consequence', $.block),
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
      field('body', $.block),
    ),

    else_clause: $ => seq(
      kw('Else'),
      $._terminator,
      field('body', $.block),
    ),

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
      optional(':'),
      $._terminator,
      field('body', $.block),
    ),

    case_else_clause: $ => seq(
      kw('Case'), kw('Else'),
      optional(':'),
      $._terminator,
      field('body', $.block),
    ),

    case_condition: $ => choice(
      seq(kw('Is'), choice('=', '<>', '<', '>', '<=', '>='), $.expression),
      seq($.expression, kw('To'), $.expression),
      $.expression,
    ),

    for_next_statement: $ => seq(
      kw('For'),
      field('variable', $._ambiguous_identifier),
      optional($.type_hint),
      optional(seq(kw('As'), field('type', $.type_expression))),
      '=',
      field('from', $.expression),
      kw('To'),
      field('to', $.expression),
      optional(seq(kw('Step'), field('step', $.expression))),
      $._terminator,
      field('body', $.block),
      kw('Next'),
      optional(field('next_variable', $._ambiguous_identifier)),
      $._terminator,
    ),

    for_each_statement: $ => seq(
      kw('For'), kw('Each'),
      field('variable', $._ambiguous_identifier),
      optional($.type_hint),
      kw('In'),
      field('collection', $.expression),
      $._terminator,
      field('body', $.block),
      kw('Next'),
      optional(field('next_variable', $._ambiguous_identifier)),
      $._terminator,
    ),

    while_statement: $ => seq(
      kw('While'),
      field('condition', $.expression),
      $._terminator,
      field('body', $.block),
      kw('Wend'),
      $._terminator,
    ),

    do_loop_statement: $ => choice(
      seq(kw('Do'), $._terminator, field('body', $.block), kw('Loop'), $._terminator),
      seq(kw('Do'), choice(kw('While'), kw('Until')), field('condition', $.expression), $._terminator, field('body', $.block), kw('Loop'), $._terminator),
      seq(kw('Do'), $._terminator, field('body', $.block), kw('Loop'), choice(kw('While'), kw('Until')), field('condition', $.expression), $._terminator),
    ),

    with_statement: $ => seq(
      kw('With'),
      optional(kw('New')),
      field('object', $.expression),
      $._terminator,
      field('body', $.block),
      kw('End'), kw('With'),
      $._terminator,
    ),
```

Also add `inline_if_statement` and `block_if_statement` to the `conflicts` array:
```javascript
  conflicts: $ => [
    ...,
    [$.inline_if_statement, $.block_if_statement],
  ],
```

- [ ] **Step 3: Generate and run tests**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "statements"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js test/corpus/statements.txt src/
git commit -m "feat: add if, select case, and loop statements"
```

---

## Task 10: VB6-specific statements (GoTo, GoSub, On Error, Resume, labels)

**Files:**
- Modify: `grammar.js` (replace VB6-specific placeholders)
- Modify: `test/corpus/statements.txt`

- [ ] **Step 1: Append corpus tests**

These tests use `$PROLEAP/src/test/resources/com/microsoft/msdn/statements/GoTo.cls` as source reference.

Append to `test/corpus/statements.txt`:

```
================================================================================
GoTo statement
================================================================================

Sub Main()
    GoTo LastLine
LastLine:
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (goto_statement
          label: (identifier))
        (label_statement
          name: (identifier))))))

================================================================================
GoSub and Return
================================================================================

Sub Main()
    GoSub MyRoutine
    Exit Sub
MyRoutine:
    Beep
    Return
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (gosub_statement
          label: (identifier))
        (exit_statement)
        (label_statement
          name: (identifier))
        (beep_statement)
        (return_statement)))))

================================================================================
On Error GoTo
================================================================================

Sub Main()
    On Error GoTo ErrHandler
    Exit Sub
ErrHandler:
    Resume Next
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (on_error_statement
          label: (identifier))
        (exit_statement)
        (label_statement
          name: (identifier))
        (resume_statement)))))

================================================================================
On Error Resume Next
================================================================================

Sub Main()
    On Error Resume Next
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (on_error_resume_next_statement)))))

================================================================================
On GoTo statement
================================================================================

Sub Main()
    On x GoTo Line1, Line2, Line3
End Sub

--------------------------------------------------------------------------------

(source_file
  (module_body
    (sub_declaration
      name: (identifier)
      parameters: (parameter_list)
      body: (block
        (on_goto_statement
          condition: (identifier)
          (identifier)
          (identifier)
          (identifier))))))
```

- [ ] **Step 2: Replace VB6-specific statement placeholders**

In `grammar.js`, replace the placeholder rules:

```javascript
    goto_statement: $ => seq(
      kw('GoTo'),
      field('label', $._ambiguous_identifier),
      $._terminator,
    ),

    gosub_statement: $ => seq(
      kw('GoSub'),
      field('label', $._ambiguous_identifier),
      $._terminator,
    ),

    return_statement: $ => seq(kw('Return'), $._terminator),

    label_statement: $ => seq(
      field('name', $._ambiguous_identifier),
      ':',
      $._terminator,
    ),

    on_error_statement: $ => choice(
      seq(kw('On'), kw('Error'), kw('GoTo'), field('label', $._ambiguous_identifier), $._terminator),
      $.on_error_resume_next_statement,
      seq(kw('On'), kw('Error'), kw('GoTo'), '0', $._terminator),
    ),

    on_error_resume_next_statement: $ => seq(
      kw('On'), kw('Error'), kw('Resume'), kw('Next'),
      $._terminator,
    ),

    resume_statement: $ => seq(
      kw('Resume'),
      optional(choice(kw('Next'), field('label', $._ambiguous_identifier))),
      $._terminator,
    ),

    on_goto_statement: $ => seq(
      kw('On'),
      field('condition', $.expression),
      kw('GoTo'),
      commaSep1(field('label', $._ambiguous_identifier)),
      $._terminator,
    ),

    on_gosub_statement: $ => seq(
      kw('On'),
      field('condition', $.expression),
      kw('GoSub'),
      commaSep1(field('label', $._ambiguous_identifier)),
      $._terminator,
    ),
```

Add to `conflicts`:
```javascript
    [$.on_error_statement, $.on_goto_statement, $.on_gosub_statement],
    [$.label_statement, $.assignment_statement],
```

- [ ] **Step 3: Generate and run tests**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test -f "GoTo\|GoSub\|Error\|Resume\|GoTo"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js test/corpus/statements.txt src/
git commit -m "feat: add VB6-specific control flow statements (GoTo, GoSub, On Error, Resume, labels)"
```

---

## Task 11: Complete I/O and utility statement tests

**Files:**
- Modify: `test/corpus/statements.txt`

Convert each `.cls` file from `$PROLEAP/src/test/resources/com/microsoft/msdn/statements/` to a corpus test. For each file `Foo.cls`, wrap bare code in `Sub Main() ... End Sub` if it lacks a Sub wrapper.

- [ ] **Step 1: Add corpus tests for all MSDN statement files**

For each of these proleap test files, add a corpus entry to `test/corpus/statements.txt`. Source files are in `$PROLEAP/src/test/resources/com/microsoft/msdn/statements/`.

Key files to convert (read each `.cls` file, wrap in `Sub Main()` if needed, write expected tree):

| proleap file | statement rule | notes |
|---|---|---|
| `Beep.cls` | `beep_statement` | wrap bare code |
| `Close.cls` | `close_statement` | |
| `Date.cls` | `date_statement` | |
| `Declare.cls` | `declare_declaration` | module-level |
| `Deftype.cls` | `deftype_declaration` | module-level |
| `Enum.cls` | `enum_declaration` | module-level |
| `FileCopy.cls` | `filecopy_statement` | |
| `GoSubReturn.cls` | `gosub_statement`, `return_statement` | |
| `GoTo.cls` | `goto_statement`, `label_statement` | |
| `Kill.cls` | `kill_statement` | |
| `Name.cls` | `name_statement` | |
| `OnGoSubOnGoTo.cls` | `on_gosub_statement`, `on_goto_statement` | |
| `PropertyGet.cls` | `property_get_declaration` | module-level |
| `Randomize.cls` | `randomize_statement` | |
| `Resume.cls` | `resume_statement` | |
| `Static.cls` | `dim_statement` with Static | |
| `Stop.cls` | `stop_statement` | |
| `Type.cls` | `type_declaration` | module-level |
| `WhileWend.cls` | `while_statement` | wrap bare code |

For each file, read it with `cat $PROLEAP/src/test/resources/com/microsoft/msdn/statements/Foo.cls`, then write the corpus entry. Use `npx tree-sitter parse` to get the actual tree output — paste it as the expected tree.

Example workflow for `Beep.cls`:
```bash
# Read source
cat $PROLEAP/src/test/resources/com/microsoft/msdn/statements/Beep.cls
# Output: bare code (needs Sub wrapper)

# Parse it to get expected tree
cat > /tmp/beep_test.cls << 'EOF'
Sub Main()
    Dim I
    For I = 1 To 3
        Beep
    Next I
End Sub
EOF
npx tree-sitter parse /tmp/beep_test.cls
# Copy output into corpus test expected section
```

- [ ] **Step 2: Run all tests**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test
```

Fix any failures by adjusting grammar rules or expected trees.

- [ ] **Step 3: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add grammar.js test/corpus/statements.txt src/
git commit -m "feat: add comprehensive statement corpus tests from proleap MSDN examples"
```

---

## Task 12: Parse proleap HelloWorld and integration verification

**Files:**
- No grammar changes — verification only

- [ ] **Step 1: Parse the HelloWorld.cls from proleap**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter parse /Users/asteroid/Code/proleap-vb6-parser/src/test/resources/io/proleap/vb6/ast/HelloWorld.cls
```

Expected output — no `(ERROR ...)` nodes:
```
(source_file [0, 0] - [3, 0]
  (module_body [0, 0] - [3, 0]
    (sub_declaration [0, 0] - [2, 7]
      (visibility [0, 0] - [0, 7])
      name: (identifier [0, 12] - [0, 28])
      parameters: (parameter_list [0, 29] - [0, 31])
      body: (block [1, 0] - [2, 0]
        (assignment_statement [1, 3] - [1, 31]
          target: (member_access_expression ...
          value: (string_literal ...))))))
```

- [ ] **Step 2: Parse a .bas file with Option Explicit and multiple subs**

Create `/tmp/sample.bas`:
```vb
Option Explicit

Dim g_count As Integer

Sub Initialize()
    g_count = 0
End Sub

Function GetCount() As Integer
    GetCount = g_count
End Function
```

```bash
npx tree-sitter parse /tmp/sample.bas
```

Expected: clean parse, no ERROR nodes.

- [ ] **Step 3: Parse the GoTo.cls test file**

```bash
npx tree-sitter parse /Users/asteroid/Code/proleap-vb6-parser/src/test/resources/com/microsoft/msdn/statements/GoTo.cls
```

Expected: `goto_statement`, `label_statement`, `inline_if_statement` nodes visible, no ERROR nodes.

- [ ] **Step 4: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add .
git commit -m "test: verify parse of proleap sample files"
```

---

## Task 13: Highlight and locals queries

**Files:**
- Modify: `queries/highlights.scm`
- Modify: `queries/locals.scm`

- [ ] **Step 1: Write highlights.scm**

Write `queries/highlights.scm`:

```scheme
; Keywords
[
  "Sub" "End" "Function" "If" "Then" "Else" "ElseIf"
  "For" "To" "Step" "Next" "While" "Wend" "Do" "Loop"
  "Select" "Case" "With" "GoTo" "GoSub" "Return"
  "On" "Error" "Resume" "Exit" "Dim" "ReDim" "Const"
  "Set" "Let" "New" "Call" "Implements" "Property"
  "Get" "Let" "Set" "Type" "Enum" "Declare" "Event"
  "Public" "Private" "Friend" "Static" "ByVal" "ByRef"
  "Optional" "ParamArray" "As" "In" "Each"
  "And" "Or" "Not" "Xor" "Eqv" "Imp" "Is" "Like" "Mod"
  "AddressOf" "TypeOf" "New" "Nothing" "Empty" "Null"
  "True" "False"
] @keyword

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
```

- [ ] **Step 2: Write locals.scm**

Write `queries/locals.scm`:

```scheme
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
```

- [ ] **Step 3: Run tests and verify highlights don't break generate**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test
```

- [ ] **Step 4: Commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add queries/highlights.scm queries/locals.scm src/
git commit -m "feat: add highlight and locals queries"
```

---

## Task 14: Final generate, README, and package verification

**Files:**
- Create: `README.md`
- Verify: `src/parser.c` is current

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npx tree-sitter generate && npx tree-sitter test
```

Expected: all corpus tests pass, zero failures.

- [ ] **Step 2: Test node.js binding**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
npm install
node -e "
const Parser = require('tree-sitter');
const VB6 = require('./bindings/node');
const parser = new Parser();
parser.setLanguage(VB6);
const tree = parser.parse('Sub Main()\n  Beep\nEnd Sub\n');
console.log(tree.rootNode.toString());
"
```

Expected: `(source_file (module_body (sub_declaration ...)))` printed. No errors.

- [ ] **Step 3: Verify no ERROR nodes when parsing proleap test corpus**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
PROLEAP=/Users/asteroid/Code/proleap-vb6-parser
find $PROLEAP/src/test/resources -name "*.cls" | while read f; do
  result=$(npx tree-sitter parse "$f" 2>&1)
  if echo "$result" | grep -q "ERROR"; then
    echo "ERROR in: $f"
    echo "$result" | grep "ERROR" | head -3
  fi
done
```

Expected: zero ERROR reports (or only in files with `#If Win32 Then` macro blocks which are not supported). For any unexpected ERRORs, note which grammar rule needs fixing and fix it.

- [ ] **Step 4: Create README.md**

Create `README.md` with this content:

```markdown
# tree-sitter-vb6

Tree-sitter grammar for Visual Basic 6.0 targeting static analysis and migration tooling.

## Supported file types

- `.cls` — Class modules
- `.bas` — Standard modules

## Usage

### Node.js

\`\`\`js
const Parser = require('tree-sitter');
const VB6 = require('tree-sitter-vb6');
const parser = new Parser();
parser.setLanguage(VB6);
const tree = parser.parse(sourceCode);
\`\`\`

### CLI

\`\`\`bash
tree-sitter parse your_file.cls
\`\`\`

## Grammar sources

- Grammar spec reference: [proleap-vb6-parser](https://github.com/uwol/proleap-vb6-parser) ANTLR4 grammar
- Project scaffold: [tree-sitter-vb6](https://github.com/CodeAnt-AI/tree-sitter-vb6)

## Development

\`\`\`bash
npm install
npx tree-sitter generate
npx tree-sitter test
\`\`\`
```

- [ ] **Step 5: Final commit**

```bash
cd /Users/asteroid/Code/tree-sitter-vb6
git add README.md src/
git commit -m "feat: finalize tree-sitter-vb6 parser with full VB6 grammar coverage"
```

---

## Known Challenges and Notes

### Conflict resolution
Tree-sitter will report conflicts during `generate`. Add conflicting rule pairs to `conflicts: $ => [...]`. Common pairs:

```javascript
conflicts: $ => [
  [$.expression, $._left_hand_side],
  [$.call_expression, $.index_expression],
  [$.inline_if_statement, $.block_if_statement],
  [$.on_error_statement, $.on_goto_statement, $.on_gosub_statement],
  [$.label_statement, $.assignment_statement],
  [$.assignment_statement, $.call_statement],
],
```

### ambiguousIdentifier expansion
When a VB6 keyword appears in an identifier position and causes a parse error, add it to `_ambiguous_identifier`:

```javascript
_ambiguous_identifier: $ => choice(
  $.identifier,
  alias(kw('Name'), $.identifier),
  alias(kw('Date'), $.identifier),
  // add more as needed:
  alias(kw('SomeKeyword'), $.identifier),
),
```

### Macro blocks
VB6 `#If Win32 Then ... #End If` macro conditionals are NOT supported by this grammar. Files containing them will produce partial parses. This is acceptable for the static analysis use case — macro blocks appear infrequently.

### inline_statement vs full statement
The `inline_if_statement` rule uses `inline_statement` (no terminator) while `block_if_statement` uses `block` (with terminators). If an inline-if body needs a statement type not covered by `inline_statement`, add it there.

### `End` statement ambiguity
The VB6 `End` keyword appears in:
- `End Sub`, `End Function`, `End Property`, `End Type`, `End If`, etc. — part of compound keywords
- Standalone `End` — terminates the program

The `end_statement` rule matches standalone `End` followed by `_terminator`. This conflicts with `End Sub` etc. Use `prec` or `conflicts` to resolve.
