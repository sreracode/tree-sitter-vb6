' =========================================================================
' 模組名稱: modReportEngine.bas
' 功能描述: 進階銷售數據分析與批次更新引擎 (展示長 SQL 與交易處理)
' =========================================================================
Option Explicit

' 宣告 Windows API 用於效能計時
Private Declare Function GetTickCount Lib "kernel32" () As Long

Public Sub ExecuteComplexReport()
    Dim conn As ADODB.Connection
    Dim rs As ADODB.Recordset
    Dim cmd As ADODB.Command
    Dim sql As String
    Dim startTime As Long
    Dim affectedRows As Long
    
    Dim targetRegion As String
    Dim minTargetAmount As Double
    
    ' 模擬外部傳入的篩選條件
    targetRegion = "North"
    minTargetAmount = 500000
    
    Set conn = New ADODB.Connection
    Set rs = New ADODB.Recordset
    Set cmd = New ADODB.Command
    
    ' 1. 建立資料庫連線 (以 SQL Server 為例)
    On Error GoTo ConnectionError
    conn.ConnectionString = "Provider=SQLOLEDB;Data Source=YourServer;Initial Catalog=ERP_DB;Integrated Security=SSPI;"
    conn.CursorLocation = adUseClient
    conn.Open
    On Error GoTo 0

    ' 2. 動態建構複雜長 SQL (包含 Common Table Expressions (CTE)、視窗函數、多表 Join 與子查詢)
    ' 使用 VB6 的字串接續符 (_) 與 Space 確保語法正確
    sql = ""
    sql = sql & "WITH MonthlySalesCTE AS (" & vbCrLf
    sql = sql & "    SELECT " & vbCrLf
    sql = sql & "        e.EmployeeID, " & vbCrLf
    sql = sql & "        e.FirstName + ' ' + e.LastName AS FullName, " & vbCrLf
    sql = sql & "        d.DepartmentName, " & vbCrLf
    sql = sql & "        DATEPART(yyyy, o.OrderDate) AS SalesYear, " & vbCrLf
    sql = sql & "        DATEPART(mm, o.OrderDate) AS SalesMonth, " & vbCrLf
    sql = sql & "        SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS TotalSubAmount " & vbCrLf
    sql = sql & "    FROM Employees e " & vbCrLf
    sql = sql & "    INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID " & vbCrLf
    sql = sql & "    INNER JOIN Orders o ON e.EmployeeID = o.EmployeeID " & vbCrLf
    sql = sql & "    INNER JOIN [Order Details] od ON o.OrderID = od.OrderID " & vbCrLf
    sql = sql & "    WHERE e.Region = ? AND o.Status = 'Completed' " & vbCrLf
    sql = sql & "    GROUP BY e.EmployeeID, e.FirstName, e.LastName, d.DepartmentName, DATEPART(yyyy, o.OrderDate), DATEPART(mm, o.OrderDate) " & vbCrLf
    sql = sql & "), " & vbCrLf
    sql = sql & "RankedSalesCTE AS (" & vbCrLf
    sql = sql & "    SELECT " & vbCrLf
    sql = sql & "        EmployeeID, FullName, DepartmentName, SalesYear, SalesMonth, TotalSubAmount, " & vbCrLf
    sql = sql & "        ROW_NUMBER() OVER (PARTITION BY SalesYear, SalesMonth ORDER BY TotalSubAmount DESC) AS MonthRank, " & vbCrLf
    sql = sql & "        AVG(TotalSubAmount) OVER (PARTITION BY EmployeeID) AS EmpAverageAmount " & vbCrLf
    sql = sql & "    FROM MonthlySalesCTE " & vbCrLf
    sql = sql & ") " & vbCrLf
    sql = sql & "SELECT " & vbCrLf
    sql = sql & "    r.EmployeeID, r.FullName, r.DepartmentName, r.SalesYear, r.SalesMonth, " & vbCrLf
    sql = sql & "    r.TotalSubAmount, r.MonthRank, r.EmpAverageAmount, " & vbCrLf
    sql = sql & "    (r.TotalSubAmount - r.EmpAverageAmount) AS VarianceFromAverage, " & vbCrLf
    sql = sql & "    CASE " & vbCrLf
    sql = sql & "        WHEN r.TotalSubAmount >= ? THEN 'A+' " & vbCrLf
    sql = sql & "        WHEN r.TotalSubAmount >= (? * 0.8) THEN 'A' " & vbCrLf
    sql = sql & "        ELSE 'B' " & vbCrLf
    sql = sql & "    End AS PerformanceRating " & vbCrLf
    sql = sql & "FROM RankedSalesCTE r " & vbCrLf
    sql = sql & "WHERE r.SalesYear = 2025 " & vbCrLf
    sql = sql & "ORDER BY r.SalesYear DESC, r.SalesMonth ASC, r.TotalSubAmount DESC;"

    ' 3. 使用 Command 物件與參數化查詢 (防止 SQL Injection 並提升效能)
    With cmd
        .ActiveConnection = conn
        .CommandText = sql
        .CommandType = adCmdText
        .CommandTimeout = 60 ' 設定超時為 60 秒
        
        ' 依序加入 SQL 中的問號 (?) 參數
        .Parameters.Append .CreateParameter("@Region", adVarChar, adParamInput, 50, targetRegion)
        .Parameters.Append .CreateParameter("@TargetAmt1", adDouble, adParamInput, , minTargetAmount)
        .Parameters.Append .CreateParameter("@TargetAmt2", adDouble, adParamInput, , minTargetAmount)
    End With

    ' 4. 執行查詢並紀錄耗時
    startTime = GetTickCount()
    Set rs = cmd.Execute()
    Debug.Print "查詢執行時間: " & (GetTickCount() - startTime) & " ms"

    ' 5. 資料處理與批次交易更新 (Transaction)
    On Error GoTo TransactionError
    conn.BeginTrans
    
    If Not (rs.BOF And rs.EOF) Then
        Do While Not rs.EOF
            ' 僅處理評等為 'A+' 的頂尖員工，同步更新其年度效能資料表
            If rs.Fields("PerformanceRating").Value = "A+" Then
                Dim updateSql As String
                updateSql = "UPDATE EmployeePerformance SET " & _
                            " BonusLog = 'Top Performer " & rs.Fields("SalesMonth").Value & "M', " & _
                            " LastUpdated = GETDATE() " & _
                            " WHERE EmployeeID = " & rs.Fields("EmployeeID").Value & _
                            " AND EvaluationYear = " & rs.Fields("SalesYear").Value
                
                conn.Execute updateSql, affectedRows, adCmdText + adExecuteNoRecords
            End If
            rs.MoveNext
        Loop
    End If
    
    conn.CommitTrans
    Debug.Print "批次交易更新成功。"

    ' 6. 關閉資源
    rs.Close
    conn.Close
    GoTo CleanUp

TransactionError:
    ' 交易失敗，回復變更
    If conn.State = adStateOpen Then conn.RollbackTrans
    MsgBox "交易失敗，已全面回滾。錯誤原因: " & Err.Description, vbCritical, "資料庫錯誤"
    GoTo CleanUp

ConnectionError:
    MsgBox "無法連線至資料庫。請檢查網路或連線字串。" & vbCrLf & "錯誤碼: " & Err.Number, vbCritical, "連線錯誤"

CleanUp:
    ' 釋放記憶體
    Set rs = Nothing
    Set cmd = Nothing
    Set conn = Nothing
End Sub