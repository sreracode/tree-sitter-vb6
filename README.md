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

### Neovim (nvim-treesitter)

1. Register the parser in your nvim-treesitter config (e.g. `after/plugin/treesitter.lua`):

```lua
vim.opt.runtimepath:append("/path/to/tree-sitter-vb6")

local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.vb6 = {
  install_info = {
    url = "/path/to/tree-sitter-vb6",
    files = { "src/parser.c" },
    generate_requires_npm = false,
    requires_generate_from_grammar = false,
  },
  filetype = "vb6",
}

vim.filetype.add({
  extension = {
    bas = "vb6",
    frm = "vb6",
    cls = "vb6",
  },
})
```

2. Install the parser:

```
:TSInstall vb6
```

> **Note:** The parser must be compiled with ABI 14 for current nvim-treesitter versions.
> Run `npx tree-sitter generate --abi 14` if you see an ABI mismatch error.

> **Note:** Mapping `.cls` overrides other filetypes (Java, C#). Remove `cls = "vb6"` if this causes conflicts and use `:set ft=vb6` manually instead.

## Development

```bash
npm install
npx tree-sitter generate
npx tree-sitter test
```

## Grammar sources

- Language spec reference: [proleap-vb6-parser](https://github.com/uwol/proleap-vb6-parser) ANTLR4 grammar
- Project scaffold: [tree-sitter-vb-dotnet](https://github.com/CodeAnt-AI/tree-sitter-vb-dotnet)
