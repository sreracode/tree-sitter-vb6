# tree-sitter-vb6 — Grammar 維護手冊

## 正確率基準（不得退步）

每次改 grammar.js 後必須全部通過：

| 測試集 | 基準 | 指令 |
|--------|------|------|
| corpus tests | **90/90** | `npx tree-sitter test` |
| vb6-sample | **781/784** (99.6%) | 見下方 TSV 指令 |
| proleap | **191/196** | `find test/proleap -name "*.cls" -o -name "*.bas" \| ...` |

## 工作流程

```bash
# 修改 grammar.js 後
npx tree-sitter generate        # Unresolved conflict → 必須修；unnecessary conflict → 可忽略

# corpus test（必須 90/90）
npx tree-sitter test

# vb6-sample 快速重測（用 tree-sitter binary，比 npx 快 4 倍）
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

# commit
git add grammar.js src/ test/corpus/ test/vb6-errors.tsv && git commit -m "fix(grammar): ..."
```

---

## 已知失敗（不計入通過率）

### vb6-sample：3 個檔案
位於 `test/vb6-sample/[Include]/HardcodeVB/Components/`（ComCtl.cls、Settings.cls、WinTool.cls）。

Pattern：`#If … Then / Sub name(sig1) / #Else / Sub name(sig2) / #End If / 共用 body / End Sub`

Sub signature 被 `#If` 切開，需要 grammar 跨 compiler-directive 邊界解析 sub_declaration，結構上很難支援。

### proleap：5 個檔案
- `DoLoop.cls` ×2：VBA 專屬語法（`f(x).Method` chain + 具名引數 `key1:=val`）
- `MyClassArray.cls`：`f(x).Method args`（known limitation）
- `SavePicture.cls`：`Circle` 圖形語句
- `InvalidKeyword.cls`：刻意使用非法 keyword，測試 error recovery 用

---

## 已知語法限制

- `Circle (x,y), r, color` — 特殊座標語法，需專用 rule（低優先）
- `f(x).Method args` — 在 function/index 結果上呼叫方法，無 `Call` 關鍵字；GLR 無法穩定偏好 member_access 路徑
- 數字行號前綴（`100 GoTo 200`）— BASIC 式行號，尚未支援
- ~~VB6 keywords 不會被 syntax highlight~~ — 已修，見 `kw()` / `ci_token()` 說明於「待新增功能 §1」

---

## 待改進（grammar 優雅性）

### A. 格式化超長單行 rule（低風險）

下列 rule 塞在單行，難以維護，應拆成多行：

```
open_statement     — 約 140 字元，Access/Lock/Len 子句全擠在一起
do_loop_statement  — 三個 choice 各一行，每行超長
mid_statement      — Mid/MidB/Mid$/MidB$ 加賦值全在一行
lock_statement     — optional 嵌套複雜
unlock_statement   — 同上
on_error_statement — 多個 choice 混在 choice() 裡
```

純格式改動，不影響行為，改完只需確認 `npx tree-sitter generate` 無報錯。

### B. 刪掉 unnecessary conflicts（清理雜訊）

`npx tree-sitter generate` 目前警告以下 4 個 unnecessary conflicts：

```js
[$.expression, $.case_condition]
[$.index_expression, $.call_statement]
[$.print_statement, $.output_item]
[$.call_statement, $.label_statement]
```

從 `conflicts` 陣列刪掉後跑 `npx tree-sitter test`，若 90/90 通過即可 commit。
保留沒有害，但會讓 conflicts 清單失去信號價值（看不出哪些是真正必要的）。

### C. `module_options` 試合併 `option_statement`（中等風險）

目前 `module_options`（第 176 行）把所有 option 的 choice 手寫一遍，
和 `option_statement`（第 794 行）完全重複。

嘗試改成：
```js
module_options: $ => repeat1(choice($.option_statement, $._newline)),
```

可能新增一個 conflict（`$.module_options` 或 `$.module_body` 相關），加進 `conflicts` 即可。
若 generate 成功且 90/90 + 781/784 + 191/196 全部通過，則是淨收益。
若 generate 卡 Unresolved conflict 且無法解決，revert。

---

## 待新增功能（優先順序排列）

### ✅ 1. 補全 `queries/highlights.scm`（已完成）

目前完全缺少關鍵字 highlight，在任何編輯器裡看起來都是白色一片。

需要加的 captures（以下只是骨架，完整 pattern 請查 grammar.js rule 名稱）：

```scheme
; 關鍵字 — 宣告
["Sub" "End" "Function" "Property" "Get" "Set" "Let"
 "Dim" "Public" "Private" "Friend" "Static" "Declare"
 "Type" "Enum" "Event" "Implements" "WithEvents"
 "Lib" "Alias" "As" "New"] @keyword

; 關鍵字 — 控制流
["If" "Then" "ElseIf" "Else" "End If"
 "Select" "Case" "For" "Each" "Next" "To" "Step"
 "While" "Wend" "Do" "Loop" "Until"
 "With" "GoTo" "GoSub" "Return"
 "Exit" "Resume" "On" "Error"] @keyword.control

; 關鍵字 — 運算子
["And" "Or" "Not" "Xor" "Is" "Like" "Mod" "Eqv" "Imp"] @keyword.operator

; 修飾子
["ByVal" "ByRef" "Optional" "ParamArray"] @keyword.modifier

; 函式呼叫
(call_expression function: _ @function.call)
(call_statement call: _ @function.call)

; 常數
[(nothing_literal) (empty_literal) (null_literal)] @constant.builtin

; 字串跳脫
(string_literal "\"\"" @string.escape)
```

**實作方式**：`kw()` 原本回傳 `token(ci(word))`（regex token，在 CST 中完全隱形）。
解法是拆成兩個 helper：
- `ci_token(word)` — 原本的 `kw()` 行為，用於 `_ambiguous_identifier` 的 `alias(ci_token('X'), $.identifier)` 以避免 alias 嵌套
- `kw(word)` — 改為 `alias(ci_token(word), word.toLowerCase())`，讓關鍵字在 CST 中出現為可查詢的 anonymous node（如 `"sub"`、`"dim"`）

`line_draw_statement` 中的 `alias(kw('Line'), $.identifier)` 同樣改為 `alias(ci_token('Line'), $.identifier)`。

---

### ✅ 2. 新增 `queries/tags.scm`（已完成）

讓 `tree-sitter tags`、Neovim telescope、Helix `goto-definition` 能找到符號。

```scheme
(sub_declaration name: (identifier) @name) @definition.function
(function_declaration name: (identifier) @name) @definition.function
(property_get_declaration name: (identifier) @name) @definition.method
(property_set_declaration name: (identifier) @name) @definition.method
(property_let_declaration name: (identifier) @name) @definition.method
(type_declaration name: (identifier) @name) @definition.class
(enum_declaration name: (identifier) @name) @definition.enum
(enum_member name: (identifier) @name) @definition.constant
(event_declaration name: (identifier) @name) @definition.event
(label_statement name: (identifier) @name) @definition.label
(const_declaration (const_declarator name: (identifier) @name)) @definition.constant
```

驗證：`tree-sitter tags test/corpus/declarations.txt` 應輸出所有符號。

---

### ✅ 3. 新增 `queries/folds.scm`（已完成）

Neovim (`nvim-treesitter`)、Helix、VS Code 等用此折疊區塊。

```scheme
[
  (sub_declaration)
  (function_declaration)
  (property_get_declaration)
  (property_set_declaration)
  (property_let_declaration)
  (block_if_statement)
  (for_next_statement)
  (for_each_statement)
  (while_statement)
  (do_loop_statement)
  (with_statement)
  (select_case_statement)
  (type_declaration)
  (enum_declaration)
  (compiler_directive)
] @fold
```

---

### ✅ 4. 新增 `queries/indents.scm`（已完成）

Helix 和 Zed 需要此檔案才能正確縮排。基本規則：

- `Sub/Function/Property/If/For/While/Do/With/Type/Enum/Select` 後增加縮排
- 對應的 `End *` / `Next` / `Wend` / `Loop` 減少縮排
- `Else` / `ElseIf` / `Case` 需要「先減後增」（outdent + indent）

格式：Helix 使用 `@indent` / `@dedent` captures；nvim-treesitter 使用不同的 `@indent.begin` / `@indent.end` schema。先針對一個平台實作，再擴展。

---

### ✅ 5. 新增 `queries/textobjects.scm`（已完成）

讓 `vap`（select outer function）、`vic`（select inner call argument）等操作可用。

```scheme
(sub_declaration) @function.outer
(function_declaration) @function.outer
(block) @function.inner
(parameter) @parameter.outer
(call_expression arguments: (argument_list) @parameter.inner)
(comment) @comment.outer
```

---

## 重要設計決策（不要改）

- `indexed_assignment_statement` + `array_copy_statement`：arr(i,j)=val 和 arr()=val 的 workaround，不要合併進 assignment_statement，GLR 會衝突
- `_ambiguous_identifier` 的 keyword alias 清單：每次 keyword-as-identifier 問題就加一條，沒有更好的辦法
- `line_draw_statement` 獨立 rule：`obj.Line (x,y)-(x,y)` 語法太特殊，必須獨立
- conflicts 數量（29 條）：VB6 語法本身高度模糊，這個數量合理
