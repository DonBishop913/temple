$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Launch_Temple_Tower.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -NoExit -File C:\Temple\Enoch_Turnkey_Tower.ps1"
$Shortcut.Description = "Launch the Temple Living Dashboard (Turnkey)"
$Shortcut.IconLocation = "shell32.dll,27" # Golden Key/Security icon
$Shortcut.WorkingDirectory = "C:\Temple"
$Shortcut.Save()
Write-Host "✅ BISHOP'S KEY CREATED ON DESKTOP." -ForegroundColor Cyan
