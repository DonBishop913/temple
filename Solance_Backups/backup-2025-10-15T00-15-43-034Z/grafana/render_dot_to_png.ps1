param(
    [Parameter(Mandatory=$false)]
    [string]$Path = '.'
)

function Find-DotExe {
    if ($env:GRAPHVIZ_DOT) { return $env:GRAPHVIZ_DOT }
    $candidates = @(
        'C:\Program Files\Graphviz\bin\dot.exe',
        'C:\Program Files (x86)\Graphviz2.38\bin\dot.exe',
        'C:\Program Files\Graphviz2.38\bin\dot.exe'
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    # try to find in PATH
    $which = Get-Command dot.exe -ErrorAction SilentlyContinue
    if ($which) { return $which.Path }
    return $null
}

$dot = Find-DotExe
if (-not $dot) {
    Write-Error "dot.exe not found. Install Graphviz or set GRAPHVIZ_DOT to the full path to dot.exe"
    exit 2
}

Write-Host "Using dot.exe at: $dot"

if (Test-Path $Path -PathType Leaf) {
    $files = @((Resolve-Path $Path).ProviderPath)
} else {
    $dir = Resolve-Path $Path
    $files = Get-ChildItem -Path $dir -Filter '*.dot' | ForEach-Object { $_.FullName }
}

foreach ($f in $files) {
    $out = [System.IO.Path]::ChangeExtension($f, '.png')
    & $dot -Tpng $f -o $out
    if ($LASTEXITCODE -eq 0) { Write-Host "Rendered -> $out" } else { Write-Warning "Failed to render $f" }
}
