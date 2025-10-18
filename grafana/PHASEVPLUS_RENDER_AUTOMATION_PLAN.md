# Phase V+ Rendering Automation Plan (Council-ready)

Goal: ensure Phase V+ workflow diagrams (DOT → PNG) are automatically generated and kept current with minimal manual effort.

Options overview

1) Scheduled Windows Task (Task Scheduler)
   - Simple, wheels inside Windows-only environments.
   - Runs PowerShell batch script nightly (or on commit deploy).
   - Good for on-prem Temple PCs.

2) GitHub Actions (recommended for repo-centric automation)
   - Runs on push to main or on a cron schedule.
   - Uses a lightweight runner to install Graphviz or use python-graphviz and produce PNGs.
   - Commits generated PNGs back to a branch or creates an artifact/PR.

3) Hybrid: CI builds PNGs and publishes to an artifact store (S3/Grafana static host) and Task Scheduler runs local regenerations.


Repository integration (GitHub Actions example)

- Lightweight workflow: run on schedule or on push to dot source files; install python and graphviz; run the wrapper; upload PNGs as artifacts or commit to repo.

Example minimal workflow (save as `.github/workflows/render-dot.yml`):

```yaml
name: Render DOT to PNG
on:
  push:
    paths:
      - 'grafana/**/*.dot'
  schedule:
    - cron: '0 2 * * *' # daily at 02:00 UTC

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Graphviz
        run: sudo apt-get update && sudo apt-get install -y graphviz
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install python-graphviz
        run: pip install graphviz
      - name: Run wrapper
        run: python grafana/phase_vplus_graphviz_wrapper.py
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: phasevplus-pngs
          path: grafana/*.png
```

Notes:
- If you prefer the workflow to commit generated PNGs back to the repo, add a step that configures git and pushes changes to a helper branch; be cautious to avoid infinite CI loops (use branch filters).


Windows Task Scheduler example (PowerShell snippet)

- Create a scheduled task to run nightly:

```powershell
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -File C:\Temple\grafana\batch_render_wrapper.ps1'
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -TaskName 'PhaseVPlusRender' -Action $action -Trigger $trigger -RunLevel Highest -Description 'Nightly render DOT -> PNG for Phase V+'
```

Monitoring and rollback

- Keep generated PNGs as artifacts (CI) or versioned files in a `generated/` folder with commit history.
- If an automated render introduces unwanted changes, revert the generated branch/commit and inspect DOT diffs.

Security and permissions

- Runner/agent must have write access to the `grafana/` folder.
- If committing generated files, use a dedicated CI identity with minimal permissions.

Next steps

- Pick an automation target (GitHub Actions, Task Scheduler, or Hybrid).
- I can create the GitHub Actions workflow file and an example DOT file, and test it locally or in a dry-run GitHub Actions environment.

Would you like me to create the `.github/workflows/render-dot.yml` file and a small example DOT in `grafana/examples/`? If yes, which automation option do you prefer (CI commit artifacts, CI commit back to repo, or scheduled Task Scheduler)?
