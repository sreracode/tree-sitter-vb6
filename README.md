# tree-sitter-vb6

Tree-sitter grammar for Visual Basic 6.0, targeting static analysis and migration tooling.

## Supported file types

- `.cls` — Class modules
- `.bas` — Standard modules

## Features

- Full module structure: `VERSION` header, `Attribute`, `Option` directives
- Declarations: `Sub`, `Function`, `Property Get/Let/Set`, `Type`, `Enum`, `Declare`, `Event`, `Const`, `Dim`, `Implements`, `DefType`
- Expressions: binary/unary operators, member access, call/index, `New`, `TypeOf`, `AddressOf`
- Statements: assignment, `Let`, `Set`, `Call`, `ReDim`, `If`/`ElseIf`/`Else`, `Select Case`, `For`/`For Each`, `While`/`Wend`, `Do`/`Loop`, `With`, `GoTo`, `GoSub`, `On Error`, `Resume`, all file I/O statements
- Dot-prefix member access inside `With` blocks (`.Property = value`)
- File number expressions (`#n`) for I/O statements

## Known limitations

- `Circle` graphics statement (special `(x,y),radius` syntax not implemented)
- `#If Win32 Then ... #End If` macro conditionals produce partial parses
- Dot-prefix `With` access works but `with_member_access_expression` is a separate node type from `member_access_expression`

## Usage

### CLI

```bash
npm install
npx tree-sitter generate
npx tree-sitter parse your_file.cls
```

### Node.js

```js
const Parser = require('tree-sitter');
const VB6 = require('tree-sitter-vb6');
const parser = new Parser();
parser.setLanguage(VB6);
const tree = parser.parse(sourceCode);
```

## Development

```bash
npm install
npx tree-sitter generate
npx tree-sitter test
```

## Grammar sources

- Language spec reference: [proleap-vb6-parser](https://github.com/uwol/proleap-vb6-parser) ANTLR4 grammar
- Project scaffold: [tree-sitter-vb-dotnet](https://github.com/CodeAnt-AI/tree-sitter-vb-dotnet)
