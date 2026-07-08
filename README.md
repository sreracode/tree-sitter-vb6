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
- `Option` directives parsed as `option_statement` nodes (queryable in tree-sitter queries)

## Test status

- **90/90** corpus tests passing (`npx tree-sitter test`)
- **781/784** real-world `.cls`/`.bas` files parse without errors (99.6%)
- **191/196** [proleap-vb6-parser](https://github.com/uwol/proleap-vb6-parser) integration files parse clean

### Real-world test corpus

`test/vb6-sample/` contains 784 `.cls` and `.bas` files sourced from the [badcodes/vb6](https://github.com/badcodes/vb6) open-source VB6 repository. A small number of files with non-standard or illegal syntax were removed from the original set.

Parse results are cached in `test/vb6-errors.tsv` (format: `FAIL|filepath|error_node|source_line` or `OK|filepath||`). See the Development section above for commands to rebuild the cache.

### Known failures (3 files)

All three files use a conditional-compilation trick where `#If … #End If` wraps only the Sub/Function *signature* (not the body), with the shared body following `#End If`. This requires splitting a `sub_declaration` across a compiler-directive boundary, which is not supported by the current grammar.

```vb
#If fComponent Then
Sub DrawImage(imlst As Object, ...)    ' signature only — no body here
#Else
Sub DrawImage(imlst As Control, ...)
#End If
    ImageList_Draw ...                  ' shared body
End Sub
```

The 5 remaining proleap failures are intentional or known limitations: 2× `DoLoop.cls` (VBA-specific `f(x).Method` chain + named-argument `key1:=val` syntax), `MyClassArray.cls` (`f(x).Method args`), `SavePicture.cls` (`Circle` statement), `InvalidKeyword.cls` (intentionally illegal keyword, tests error recovery).

## Known limitations

- `Circle` graphics statement (special `(x,y),radius` syntax)
- `f(x).Method args` call syntax (method call on a function/index result without `Call` keyword)
- VB6 keywords (`Sub`, `If`, `Dim`, etc.) are not syntax-highlighted — `kw()` uses case-insensitive regex which cannot be matched by string in tree-sitter queries

## Development

```bash
npm install
npx tree-sitter generate        # must complete with no Unresolved conflicts
npx tree-sitter test            # must be 90/90
```

Run the real-world test suites after grammar changes:

```bash
# vb6-sample (784 files, target: 781/784)
find test/vb6-sample -name "*.cls" -o -name "*.bas" | sort | while read f; do
  result=$(tree-sitter parse "$f" 2>/dev/null | grep -m1 "ERROR\|MISSING")
  if [ -n "$result" ]; then
    row=$(echo "$result" | grep -oP '\[(\d+),' | head -1 | tr -dc '0-9')
    src=$(sed -n "$((row+1))p" "$f" 2>/dev/null)
    printf 'FAIL|%s|%s|%s\n' "$f" "$result" "$src"
  else
    printf 'OK|%s||\n' "$f"
  fi
done > test/vb6-errors.tsv
awk -F'|' '$1=="FAIL"{c++} $1=="OK"{ok++} END{print "FAIL:"c, "OK:"ok}' test/vb6-errors.tsv

# proleap (196 files, target: 191/196)
find test/proleap -name "*.cls" -o -name "*.bas" | sort | while read f; do
  result=$(tree-sitter parse "$f" 2>/dev/null | grep -m1 "ERROR\|MISSING")
  if [ -n "$result" ]; then printf 'FAIL|%s\n' "$f"; else printf 'OK|%s\n' "$f"; fi
done | awk -F'|' '$1=="FAIL"{c++} $1=="OK"{ok++} END{print "FAIL:"c, "OK:"ok}'
```

## References

This project is based on and references:

- [tree-sitter-vb-dotnet](https://github.com/CodeAnt-AI/tree-sitter-vb-dotnet) — project scaffold and binding structure
- [proleap-vb6-parser](https://github.com/uwol/proleap-vb6-parser) — VB6 ANTLR4 grammar used as language spec reference and integration test corpus
