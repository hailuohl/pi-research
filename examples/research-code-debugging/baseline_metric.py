import json
import math
import os
from pathlib import Path


def rmse(observed, predicted):
    if not observed or len(observed) != len(predicted):
        raise ValueError("nonempty equal-length vectors required")
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(observed, predicted)) / (len(observed) - 1))


if __name__ == "__main__":
    result = {"rmse": rmse([1.0], [0.0])}
    output = Path(os.environ.get("PI_OUTPUT_DIR", "."))
    (output / "metrics.json").write_text(json.dumps(result), encoding="utf-8")
    print(json.dumps(result))
