import os
import subprocess
from pathlib import Path

DOT_FILE = Path("grafana/PhaseVPlus_Workflow.dot")
PNG_FILE = Path("grafana/PhaseVPlus_Workflow.png")


def render_with_python_graphviz(dot_path: Path, png_path: Path) -> bool:
    # Use a guarded import so the module is only required at runtime.
    # Pylance may not have python-graphviz installed in this environment;
    # silence that specific unresolved-import complaint with a type-ignore.
    try:
        # type: ignore[import-not-found]
        from graphviz import Source  # type: ignore
    except Exception:
        print("⚠️ python-graphviz not installed or failed to import.")
        return False

    try:
        print("Attempting to render PNG using python-graphviz...")
        # graphviz.Source can load from a dot string or file; using from_file
        # ensures correctness if a DOT file exists.
        src = Source.from_file(str(dot_path))
        src.format = "png"
        # render expects basename without extension
        src.render(str(png_path.with_suffix("")), cleanup=False)
        print(f"✅ PNG rendered via python-graphviz: {png_path}")
        return True
    except Exception as e:
        print(f"⚠️ Error using python-graphviz: {e}")
        return False


def render_with_system_dot(dot_path: Path, png_path: Path) -> bool:
    print("Attempting to render PNG using system 'dot' command...")
    try:
        subprocess.run(
            ["dot", "-Tpng", str(dot_path), "-o", str(png_path)],
            check=True,
        )
        print(f"✅ PNG rendered via system dot: {png_path}")
        return True
    except FileNotFoundError:
        print("⚠️ 'dot' command not found. Install Graphviz and ensure it's in PATH.")
        return False
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Error executing 'dot': {e}")
        return False


def main() -> None:
    if not DOT_FILE.exists():
        print(f"⚠️ DOT file does not exist: {DOT_FILE}")
        return

    # Try python-graphviz first
    if not render_with_python_graphviz(DOT_FILE, PNG_FILE):
        # Fall back to system dot
        render_with_system_dot(DOT_FILE, PNG_FILE)


if __name__ == "__main__":
    main()
