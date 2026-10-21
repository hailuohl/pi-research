import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def check(path):
    command = [sys.executable, "check_metric.py", path]
    result = subprocess.run(command, capture_output=True, text=True, timeout=15)
    return {"command": command, "returncode": result.returncode,
            "stdout": result.stdout, "stderr": result.stderr,
            "source_sha256": sha(path), "test_sha256": sha("check_metric.py")}


before = check("baseline_metric.py")
after = check("metric.py")
assert before["returncode"] == 1, before
assert "ZeroDivisionError" in before["stderr"] and "AssertionError" in before["stderr"], before
assert after["returncode"] == 0, after
assert "Ran 3 tests" in before["stderr"] and "Ran 3 tests" in after["stderr"]
assert before["test_sha256"] == after["test_sha256"]
output = Path(os.environ["PI_OUTPUT_DIR"])
output.joinpath("red-green.json").write_text(
    json.dumps({"version": 1, "purpose": "synthetic software regression only",
                "before": before, "after": after}, ensure_ascii=False, indent=2), encoding="utf-8")
print("Observed the original failure and repaired pass with the same three tests; red-green.json archived.")
