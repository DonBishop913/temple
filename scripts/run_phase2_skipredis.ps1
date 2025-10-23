$env:SKIP_REDIS='1'
Start-Transcript -Path 'C:\Temple\logs\phase2_autonomous.log' -Force
& 'C:\Temple\council-dashboard\scripts\phase2_autonomous.ps1' -RedisPath 'C:\Redis' -ApiUrl 'http://localhost:4321' -Verbose
Stop-Transcript
Write-Output "Phase2 run complete. Transcript saved to C:\Temple\logs\phase2_autonomous.log"