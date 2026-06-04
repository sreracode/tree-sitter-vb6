# tree-sitter-vb6

Tree-sitter grammar for Visual Basic 6.0, targeting static analysis and migration tooling.

## Installation

```bash
pip install tree-sitter
pip install git+https://github.com/Comet0322/tree-sitter-vb6.git
```

## Usage

### Python

```python
from tree_sitter import Language, Parser
import tree_sitter_vb6

parser = Parser(Language(tree_sitter_vb6.language()))
tree = parser.parse(b"Public Sub Hello()\n    MsgBox \"Hello\"\nEnd Sub\n")
print(tree.root_node.sexp())
```

### Node.js

```js
const Parser = require('tree-sitter');
const VB6 = require('tree-sitter-vb6');
const parser = new Parser();
parser.setLanguage(VB6);
const tree = parser.parse(sourceCode);
```

### CLI

```bash
npm install
npx tree-sitter generate
npx tree-sitter parse your_file.cls
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

## Supported file types

- `.cls` — Class modules
- `.bas` — Standard modules
- `.frm` — Form files (including `Begin VB.Form ... End` control blocks)

## Features

- Full module structure: `VERSION` header, `Attribute`, `Option` directives, `.frm` form blocks
- Declarations: `Sub`, `Function`, `Property Get/Let/Set`, `Type`, `Enum`, `Declare`, `Event`, `Const`, `Dim`, `Implements`, `DefType`
- Expressions: binary/unary operators, member access, call/index, `New`, `TypeOf`, `AddressOf`
- Statements: assignment, `Let`, `Set`, `Call`, `ReDim`, `If`/`ElseIf`/`Else`, `Select Case`, `For`/`For Each`, `While`/`Wend`, `Do`/`Loop`, `With`, `GoTo`, `GoSub`, `On Error` (including `On Local Error`), `Resume`, all file I/O statements
- Dot-prefix member access inside `With` blocks (`.Property = value`)
- `Me` keyword, dotted type names (e.g. `VB.CommandButton`), `On Local Error GoTo`

## Test status

- **84/84** corpus tests passing
- **192/197** [proleap-vb6-parser](https://github.com/uwol/proleap-vb6-parser) integration files parse clean

Run integration tests:

```bash
find test/proleap -name "*.cls" -o -name "*.bas" -o -name "*.frm" | \
  xargs npx tree-sitter parse | grep -c ERROR || echo "0 errors"
```

## Known limitations

- `Circle` graphics statement (special `(x,y),radius` syntax)
- `#If Win32 Then ... #End If` conditional compilation directives
- VB6 keywords (`Sub`, `If`, `Dim`, etc.) are not syntax-highlighted — `kw()` uses case-insensitive regex which cannot be matched by string in tree-sitter queries

## Development

```bash
npm install
npx tree-sitter generate
npx tree-sitter test
```

## References

This project is based on and references:

- [tree-sitter-vb-dotnet](https://github.com/CodeAnt-AI/tree-sitter-vb-dotnet) — project scaffold and binding structure
- [proleap-vb6-parser](https://github.com/uwol/proleap-vb6-parser) — VB6 ANTLR4 grammar used as language spec reference and integration test corpus
