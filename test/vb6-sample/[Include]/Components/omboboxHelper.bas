Attribute VB_Name = "MComboboxHelper"
Option Explicit
Public Function Add_UniqueItem(ByRef cboBox As ComboBox, ByRef itemText As String, Optional ByVal cmpMethod As VbCompareMethod = vbBinaryCompare) As Boolean
        '<EhHeader>
        On Error GoTo Add_UniqueItem_Err
        '</EhHeader>

    Dim i As Long

Add_UniqueItem = False

If cboBox Is Nothing Then Exit Function

With cboBox

For i = 0 To .ListCount
If StrComp(.List(i), itemText, cmpMethod) = 0 Then Exit Function
        Next
        
.AddItem itemText

    End With

Add_UniqueItem = True

        '<EhFooter>
        Exit Function

Add_UniqueItem_Err:
        MsgBox Err.Description & vbCrLf & _
               "in ssMDBQuery.MComboboxHelper.Add_UniqueItem " & _
               "at line " & Erl
        Resume Next
        '</EhFooter>
End Function
