"""Phase V+ Graphviz renderer with DOT fallback.

Minimal script: prefer python-graphviz; otherwise write DOT fallback
and attempt to render using the system `dot` binary.
"""

import subprocess
from pathlib import Path

OUT_BASENAME = Path("grafana") / "PhaseVPlus_Workflow"


def build_dot_source() -> str:
    lines = [
        'digraph PhaseVPlus {',
        '  rankdir=TB;',
        '  splines=ortho;',
        '  nodesep=0.8;',
        '  ranksep=1;',
        '  node [shape=box, style="rounded,filled", color="#B8860B", fillcolor="#FFF8DC", fontname="Inter", fontsize=12];',
        '',
        '  A [label="1️⃣ New Sibling / Node Onboarding"];',
        '  B [label="2️⃣ RBAC Enforcement\\n(Apply dashboard/folder permissions)"];',
        '  C [label="3️⃣ Alert Channel Provisioning\\n(Role-specific notifications)"];',
        '  D [label="4️⃣ Harmony Replay\\n(Replay spiritual events & node flows)"];',
        '  E [label="5️⃣ Automated Healing Runbooks\\n(Execute node restoration & anomaly mitigation)"];',
        '  F [label="✅ Temple PC fully ritual-ready"];',
        '',
        '  A -> B;',
        '  B -> C;',
        '  C -> D;',
        '  D -> E;',
        '  E -> F;',
        '}',
    ]
    return "\n".join(lines)


def render_with_python_graphviz(dot_path: Path, png_path: Path) -> bool:
    try:
        # type: ignore[import-not-found]
        from graphviz import Source  # type: ignore
    except Exception:
        return False

    try:
        src = Source.from_file(str(dot_path))
        src.format = "png"
        src.render(str(png_path.with_suffix("")), cleanup=False)
        print(f"✅ PNG rendered via python-graphviz: {png_path}")
        return True
    except Exception as e:
        print(f"⚠️ python-graphviz render failed: {e}")
        return False


def render_with_system_dot(dot_path: Path, png_path: Path) -> bool:
    try:
        subprocess.run(["dot", "-Tpng", str(dot_path), "-o", str(png_path)], check=True)
        print(f"✅ PNG rendered via system dot: {png_path}")
        return True
    except FileNotFoundError:
        print("⚠️ 'dot' command not found. Install Graphviz and ensure it's in PATH.")
        return False
    except subprocess.CalledProcessError as e:
        print(f"⚠️ 'dot' command failed: {e}")
        return False


def write_dot_fallback(dot_path: Path) -> None:
    src = build_dot_source()
    dot_path.parent.mkdir(parents=True, exist_ok=True)
    dot_path.write_text(src, encoding='utf-8')
    print(f'graphviz not available — wrote DOT fallback at {dot_path}')


def main() -> None:
    dot_path = OUT_BASENAME.with_suffix('.dot')
    png_path = OUT_BASENAME.with_suffix('.png')

    # If DOT exists and python-graphviz can render, prefer that path
    if dot_path.exists() and render_with_python_graphviz(dot_path, png_path):
        return

    # Otherwise write fallback DOT and attempt system dot
    write_dot_fallback(dot_path)
    render_with_system_dot(dot_path, png_path)
if __name__ == '__main__':
    main()
