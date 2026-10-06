"""Check the real save() output routing with stdlib only; rendering is checked separately."""
import ast
import contextlib
import io
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
from unittest.mock import patch

source = Path(__file__).resolve().parents[2] / "skills/piresearch/pi-research-figures/assets/pi_figstyle.py"
tree = ast.parse(source.read_text(encoding="utf-8"))
function = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "save")
namespace = {"os": os, "sys": sys, "_audit": lambda fig: [], "plt": SimpleNamespace(close=lambda fig: None)}
exec(compile(ast.Module(body=[function], type_ignores=[]), str(source), "exec"), namespace)


class Figure:
    def savefig(self, path, format):
        Path(path).write_bytes(b"Output routing fixture; not a rendered figure")


with tempfile.TemporaryDirectory(prefix="pi-figure-output-") as temporary:
    root = Path(temporary)
    previous = Path.cwd()
    try:
        os.chdir(root)
        for variable in ("PI_OUTPUT_DIR", "OUTPUT_DIR"):
            destination = root / variable.lower()
            with patch.dict(os.environ, {"PI_OUTPUT_DIR": "", "OUTPUT_DIR": "", variable: str(destination)}), contextlib.redirect_stderr(io.StringIO()):
                paths = namespace["save"](Figure(), "figs/curve")
                assert paths == [str(destination / "figs/curve.pdf"), str(destination / "figs/curve.svg")]
                assert all(Path(path).is_file() for path in paths)
                assert not (root / "figs").exists()
                for unsafe in ("../escape", "/absolute", "C:\\escape", "figs/../escape", "figs//escape"):
                    try:
                        namespace["save"](Figure(), unsafe)
                    except ValueError:
                        pass
                    else:
                        raise AssertionError(f"Accepted unsafe output stem: {unsafe}")
        with patch.dict(os.environ, {"PI_OUTPUT_DIR": str(root / "primary"), "OUTPUT_DIR": str(root / "secondary")}), contextlib.redirect_stderr(io.StringIO()):
            namespace["save"](Figure(), "figs/priority")
            assert (root / "primary/figs/priority.pdf").is_file()
            assert not (root / "secondary").exists()
        with patch.dict(os.environ, {"PI_OUTPUT_DIR": "", "OUTPUT_DIR": ""}), contextlib.redirect_stderr(io.StringIO()):
            namespace["save"](Figure(), "figs/local")
            assert (root / "figs/local.pdf").is_file()
    finally:
        os.chdir(previous)
print("PASS: Docker/SSH output roots, traversal refusal, variable precedence and local compatibility")
