## Automatic wrapper and batch runner

We've added a small wrapper that will try `python-graphviz` first and fall back to the system `dot` binary if needed. It writes `grafana/PhaseVPlus_Workflow.png` next to the DOT file.
Files added:

- `grafana/phase_vplus_graphviz_wrapper.py` — tries python-graphviz then system dot.
- `grafana/batch_render_wrapper.ps1` — PowerShell script that runs the wrapper for every `.dot` file in the `grafana/` folder and renames outputs to match the source filenames.

Usage (single file):

```powershell
python phase_vplus_graphviz_wrapper.py
```
Usage (batch):

```powershell
.\grafana\batch_render_wrapper.ps1
```

Notes:

- If you prefer to call `dot` directly, the one-liner above remains the simplest option.
- The wrapper prints helpful diagnostics if `python-graphviz` is missing or if `dot` is not in PATH.
# Render DOT -> PNG (Windows)

This short guide shows one-line commands and a PowerShell helper to convert Graphviz DOT files to PNG on Windows.

Why: the repository emits a DOT fallback when python-graphviz or the system `dot` binary is not available. Use these commands to produce PNGs from those DOT files without installing any Python packages.

Prerequisite: Install Graphviz for Windows (contains `dot.exe`).
You can download it from the official Graphviz site and install to the default location (typically `C:\Program Files\Graphviz`).

One-liners (PowerShell)

- Render a single DOT file to PNG (adjust path to your dot.exe if different):

```powershell
& "C:\Program Files\Graphviz\bin\dot.exe" -Tpng "C:\Temple\grafana\PhaseVPlus_Workflow.dot" -o "C:\Temple\grafana\PhaseVPlus_Workflow.png"
```

- Render into same directory with same basename for all `.dot` files in a folder:

```powershell
#$GRAPHVIZ points to dot.exe; set it if you installed Graphviz somewhere else
$env:GRAPHVIZ_DOT = $env:GRAPHVIZ_DOT -or 'C:\Program Files\Graphviz\bin\dot.exe'
Get-ChildItem -Path "C:\Temple\grafana" -Filter '*.dot' | ForEach-Object {
  $in = $_.FullName
  $out = [System.IO.Path]::ChangeExtension($in, '.png')
  & $env:GRAPHVIZ_DOT -Tpng $in -o $out
  Write-Host "Rendered -> $out"
}
```

PowerShell script (recommended)

See `render_dot_to_png.ps1` in this directory — it locates `dot.exe` (checks `GRAPHVIZ_DOT` env var and common install paths), accepts a folder or single file, and renders `.dot` files to `.png`.

Scheduling

You can add the script to Windows Task Scheduler to run hourly/daily. Use an explicit path to `powershell.exe` and run with `-ExecutionPolicy Bypass -File "C:\Temple\grafana\render_dot_to_png.ps1"`.

Troubleshooting

- If you see `dot.exe` not found, ensure Graphviz is installed and the `GRAPHVIZ_DOT` environment variable points to the `dot.exe` full path.
- If PNG looks empty or missing labels, open the DOT file in a text editor to confirm content.

Questions or want me to install a cross-platform Node/Python helper for automated rendering? I can add that next.