$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\.."
$exclude = @('node_modules', 'dist')
$files = Get-ChildItem -Recurse -File | Where-Object { $exclude -notcontains $_.Directory.Name }
Compress-Archive -Path $files.FullName -DestinationPath "$PSScriptRoot\..\..\LivingDashboard.zip" -Force
Write-Output "Archive created at $PSScriptRoot\..\..\LivingDashboard.zip"
