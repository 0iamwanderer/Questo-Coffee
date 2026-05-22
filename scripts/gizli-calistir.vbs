' Questo başlat.bat icin gorunmez prosess launcher.
'
' Kullanim:
'   wscript gizli-calistir.vbs "log-dosya-adi.log" "calistirilacak komut"
'
' Verilen komutu proje kokunde, gizli pencerede calistirir; stdout+stderr
' proje-koku/logs/<log-dosya-adi> dosyasina yazilir. Senkron beklemez —
' bat dosyasi hemen devam eder.

Option Explicit

Dim sh, fso, proje_koku, log_yolu, komut

Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Bu VBS scripts/ icinde — proje koku bir ust klasor
proje_koku = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
sh.CurrentDirectory = proje_koku

If Not fso.FolderExists(proje_koku & "\logs") Then
    fso.CreateFolder proje_koku & "\logs"
End If

log_yolu = proje_koku & "\logs\" & WScript.Arguments(0)

' "0" -> vbHide (pencere yok), "False" -> beklemeden don
komut = "cmd /c " & WScript.Arguments(1) & " > """ & log_yolu & """ 2>&1"
sh.Run komut, 0, False
