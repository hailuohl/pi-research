"""Exercise the imported save() API, including its real output path helpers."""
import contextlib
import io
import os
from pathlib import Path
import sys
import tempfile
from unittest.mock import patch

sys.dont_write_bytecode = True

source = Path(__file__).resolve().parents[2] / "skills/piresearch/pi-research-figures/assets/pi_figstyle.py"
sys.path.insert(0, str(source.parent))
import pi_figstyle as style


class Figure:
    def savefig(self, path, format):
        Path(path).write_bytes(b"Output routing fixture; not a rendered figure")


log_root = source.parents[4] / ".validation/independent-figures/implementer"
log_root.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix="routing-", dir=log_root) as temporary, patch.object(style, "_audit", return_value=[]), patch.object(style.plt, "close"):
    root = Path(temporary)
    previous = Path.cwd()
    try:
        os.chdir(root)
        for variable in ("PI_OUTPUT_DIR", "OUTPUT_DIR"):
            destination = root / variable.lower()
            with patch.dict(os.environ, {"PI_OUTPUT_DIR": "", "OUTPUT_DIR": "", variable: str(destination)}), contextlib.redirect_stderr(io.StringIO()):
                paths = style.save(Figure(), "figs/curve")
                assert paths == [str(destination / "figs/curve.pdf"), str(destination / "figs/curve.svg")]
                assert all(Path(path).is_file() for path in paths)
                assert not (root / "figs").exists()
                for unsafe in ("../escape", "/absolute", "C:\\escape", "figs/../escape", "figs//escape"):
                    try:
                        style.save(Figure(), unsafe)
                    except ValueError:
                        pass
                    else:
                        raise AssertionError(f"Accepted unsafe output stem: {unsafe}")
        with patch.dict(os.environ, {"PI_OUTPUT_DIR": str(root / "primary"), "OUTPUT_DIR": str(root / "secondary")}), contextlib.redirect_stderr(io.StringIO()):
            style.save(Figure(), "figs/priority")
            assert (root / "primary/figs/priority.pdf").is_file()
            assert not (root / "secondary").exists()
        with patch.dict(os.environ, {"PI_OUTPUT_DIR": "", "OUTPUT_DIR": ""}), contextlib.redirect_stderr(io.StringIO()):
            style.save(Figure(), "figs/local")
            assert (root / "figs/local.pdf").is_file()
    finally:
        os.chdir(previous)
print("PASS: Docker/SSH output roots, traversal refusal, variable precedence and local compatibility")
