# DOT → PNG: Operational Cheat Sheet (Council)

Quick reference for rendering Graphviz DOT files to PNGs on Windows.

## When to use
- You have a `.dot` file in `grafana/` and need a PNG for dashboards or exports.
- Use the wrapper when you want automatic fallback (python-graphviz if present, otherwise system `dot`).

## Options

1) One-off using system Graphviz (if installed)

```powershell
# Render a single DOT file to PNG
dot -Tpng grafana\my_diagram.dot -o grafana\my_diagram.png
```

2) Using the repository wrapper (prefers python-graphviz)

```powershell
# Wrapper expects grafana/PhaseVPlus_Workflow.dot; it will produce grafana/PhaseVPlus_Workflow.png
python .\grafana\phase_vplus_graphviz_wrapper.py
```

3) Batch-run all DOTs (Council PowerShell snippet)

```powershell
$wrapper = "phase_vplus_graphviz_wrapper.py"
$dotFolder = "grafana"
$dotFiles = Get-ChildItem -Path $dotFolder -Filter "*.dot"

foreach ($file in $dotFiles) {
    Write-Host "Processing: $($file.Name)"
    Copy-Item -Path $file.FullName -Destination "$dotFolder\PhaseVPlus_Workflow.dot" -Force
    python $wrapper
    $pngName = [System.IO.Path]::ChangeExtension($file.FullName, ".png")
    Rename-Item -Path "$dotFolder\PhaseVPlus_Workflow.png" -NewName $pngName -Force
    Write-Host "Done: $pngName"
}
```

## Installing prerequisites

- To render via python-graphviz path:
  - pip install graphviz
  - Install Graphviz system package and ensure `dot` is in PATH (Graphviz installer for Windows).

- To render via system `dot` only:
  - Install Graphviz and ensure `dot` is in PATH.

## Troubleshooting

- If the wrapper reports `python-graphviz not installed` then either install `graphviz` in the Python environment or rely on the system `dot` binary.
- If `dot` not found: install Graphviz and add its `bin` directory to PATH. After installing, restart the shell/VS Code.
- Permissions: ensure the `grafana/` directory is writable so the wrapper can write the DOT fallback and PNG.

## Notes
- The wrapper chooses python-graphviz first. If both python-graphviz and `dot` are available, python-graphviz will be used.
- Output PNGs are renamed by the batch script to match original DOT filenames.

---
Generated for Council-grade operational use. If you want, I can add a scheduled task example (Task Scheduler) to regenerate PNGs nightly.
