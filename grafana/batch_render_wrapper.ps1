param(
    [string]$Wrapper = "phase_vplus_graphviz_wrapper.py",
    [string]$DotFolder = "grafana"
)

Write-Host "Batch rendering DOT files in folder: $DotFolder using wrapper: $Wrapper"

$dotFiles = Get-ChildItem -Path $DotFolder -Filter "*.dot" -ErrorAction SilentlyContinue
if (-not $dotFiles) {
    Write-Host "No .dot files found in $DotFolder"
    exit 0
}

foreach ($file in $dotFiles) {
    Write-Host "Processing DOT file: $($file.Name)"

    # Copy to expected name for wrapper
    $targetDot = Join-Path $DotFolder "PhaseVPlus_Workflow.dot"
    Copy-Item -Path $file.FullName -Destination $targetDot -Force

    # Run the wrapper
    python $Wrapper

    # Rename the output PNG to match original DOT name
    $outPng = Join-Path $DotFolder "PhaseVPlus_Workflow.png"
    if (Test-Path $outPng) {
        $pngName = [System.IO.Path]::ChangeExtension($file.FullName, ".png")
        Move-Item -Path $outPng -Destination $pngName -Force
        Write-Host "✅ Rendered: $pngName"
    } else {
        Write-Host "⚠️ Expected output not found: $outPng"
    }
}
