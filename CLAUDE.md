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
- VB6 keywords 不會被 syntax highlight — `kw()` 產生 case-insensitive regex，tree-sitter query 無法用字串匹配

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

## 重要設計決策（不要改）

- `indexed_assignment_statement` + `array_copy_statement`：arr(i,j)=val 和 arr()=val 的 workaround，不要合併進 assignment_statement，GLR 會衝突
- `_ambiguous_identifier` 的 keyword alias 清單：每次 keyword-as-identifier 問題就加一條，沒有更好的辦法
- `line_draw_statement` 獨立 rule：`obj.Line (x,y)-(x,y)` 語法太特殊，必須獨立
- conflicts 數量（29 條）：VB6 語法本身高度模糊，這個數量合理
