# tree-sitter-vb6 — 待修 Grammar 問題

測試語料庫：`/tmp/vb6-sample/`（badcodes/vb6 clone，已刪除非法語法檔案）
目前通過率：~90.5%（200 個 .cls/.bas 檔）

## 優先修復順序

### 1. 多維陣列 LHS 賦值 `arr(i, j) = val`（最廣泛）

**症狀**
```vb
mHeaderMap(1, 1) = sHeaderMap(0)
result(0, i) = Trim$(Left$(s, n))
```

**原因**  
`call_statement` 的 `_ambiguous_identifier optional(argument_list_no_parens)` 形式攔截了這個 pattern：
- 把 `mHeaderMap` 當成 call 的 identifier
- 把 `(1, 1) = sHeaderMap(0)` 當成 argument_list_no_parens
- `(1, 1)` 在 parenthesized_expression 裡有 comma 所以 ERROR

單維 `arr(1) = val` 也被誤解析為 call_statement（`(1) = x` 被當成比較式不報錯，但 AST 是錯的）。

**修法方向**  
在 `conflicts` 加入 `[$.assignment_statement, $.call_statement, $.index_expression]` 三方衝突，
或在 `assignment_statement` 加 `prec` 讓它在 `lhs(index_expression) '='` 情境下優先。
也可參考現有的 `array_copy_statement`（空括號版本）作為範本。

---

### 2. 括號識別符 `[identifier]`

**症狀**
```vb
Public Enum KeyRoot
    [HKEY_CLASSES_ROOT] = &H80000000
    [HKEY_CURRENT_CONFIG] = &H80000005
End Enum
Set NewEnum = mCol.[_NewEnum]
```

**原因**  
Grammar 沒有 `'[' ... ']'` 這個 token 形式。VB6 允許用中括號包住關鍵字或含特殊字元的識別符。

**修法方向**  
在 `identifier` 或 `_ambiguous_identifier` 加入：
```js
token(seq('[', /[^\]]+/, ']'))
```
並在 `member_access_expression` 的 name field 也允許此形式。

---

### 3. 巢狀 inline If

**症狀**
```vb
If cMax <> -1 Then If c >= cMax Then Exit Do
```

**原因**  
`inline_statement`（`inline_if_statement` 的 consequence）不允許另一個 `If` 作為子句。

**修法方向**  
在 `inline_statement` 加入 `$.inline_if_statement`：
```js
inline_statement: $ => choice(
  $.inline_if_statement,   // 加這行
  seq(kw('GoTo'), ...),
  ...
)
```
注意 `inline_if_statement` 本身引用 `inline_statement`，tree-sitter 允許這種遞迴。

---

### 4. With 區塊方法在 inline If 內

**症狀**
```vb
If iLo < iHi Then .Swap aTarget(iLo), aTarget(iHi)
```

**原因**  
`inline_statement` 的 `seq($.with_member_access_expression, optional($.argument_list_no_parens))` 
在 inline If 後應該可用，但有衝突未解決。待查 conflict 訊息。

---

### 5. 數字行號（低優先）

**症狀**
```vb
100 Add_UniqueItem = False
200 GoTo 300
```

**原因**  
Grammar 不支援 BASIC 式數字行號前綴。`label_statement` 只支援 `identifier ':'`。

**修法方向**  
在 `statement` 或 `block` 加入 `optional(integer_literal)` 前綴，或新增 `line_number_label` rule。

---

## 工作流程

```bash
cd /Users/asteroid/Code/tree-sitter-vb6

# 修改 grammar.js 後
npx tree-sitter generate

# 跑 corpus test
npx tree-sitter test

# 量測通過率（不要重新 parse 已知結果，直接跑）
find /tmp/vb6-sample -name "*.cls" -o -name "*.bas" | sort | head -200 | while read f; do
  npx tree-sitter parse "$f" 2>&1 | grep -q "ERROR\|MISSING" && echo "FAIL" || echo "OK"
done | sort | uniq -c

# commit
git add -A && git commit -m "fix(grammar): ..."
```

## 注意事項

- `npx tree-sitter generate` 只要出現 `Unresolved conflict` 就不能繼續，必須在 `conflicts` array 加入對應的衝突宣告
- `Warning: unnecessary conflicts` 可以忽略
- 每次修完都要跑 `npx tree-sitter test` 確保 90 個 corpus test 全部通過
- corpus test 失敗通常是因為 AST 結構改變，需要同步更新 `test/corpus/*.txt` 的期望輸出
- 期望輸出的括號數容易數錯，用 `printf '...' | npx tree-sitter parse /dev/stdin` 看實際 AST 再對齊
