"""Generate SOFTWARE DEMONSTRATION data in an isolated validation directory.

Not research results. Never run over an existing research data directory.
Dependencies: numpy only. Run: python software-demo-data.py
"""
import csv
from pathlib import Path

import numpy as np


def write_csv(root, name, fields, rows):
    with (root / name).open("x", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(fields)
        writer.writerows(rows)


def main():
    root = Path("figs")
    names = ["loss_curve.csv", "scaling.csv", "benchmarks.csv", "ablation.csv",
             "pareto.csv", "sweep.csv", "confusion.npy", "SOFTWARE-DEMONSTRATION.txt"]
    if any((root / name).exists() for name in names):
        raise FileExistsError("Refusing to overwrite existing figure data")
    root.mkdir(parents=True, exist_ok=True)
    (root / "SOFTWARE-DEMONSTRATION.txt").write_text(
        "SOFTWARE DEMONSTRATION — synthetic data, not research measurements.\n",
        encoding="utf-8",
    )
    rng = np.random.default_rng(20261007)
    write_csv(root, "loss_curve.csv", ["variant", "seed", "step", "value"],
              ((variant, seed, step, offset + 2 * np.exp(-step / 4000)
                + 0.03 * seed + rng.normal(0, 0.01))
               for variant, offset in [("baseline", 1.8), ("candidate", 1.3)]
               for seed in range(5) for step in range(0, 10001, 1000)))
    write_csv(root, "scaling.csv", ["family", "n_params", "loss", "fit"],
              (("demo", n, 1.1 + 18 * n ** -0.2, 1)
               for n in np.geomspace(1e6, 1e10, 10)))
    methods = ["Qwen2.5-Math-7B", "SimpleRL-Zero-7B (GRPO)",
               "OpenReasoner-Zero-7B (PPO)", "Oat-Zero-7B (Dr.GRPO)",
               r"ES$_\mathrm{CHKPT-1}$", r"ES$_\mathrm{CHKPT-2}$",
               r"ES$_\mathrm{CHKPT-3}$"]
    benchmarks = ["AIME 2024", "Minerva Math", "OlympiadBench", "AMC", "MATH500"]
    write_csv(root, "benchmarks.csv", ["benchmark", "method", "score"],
              ((benchmark, method, 18 + 5 * i + 3 * j)
               for i, method in enumerate(methods) for j, benchmark in enumerate(benchmarks)))
    write_csv(root, "ablation.csv", ["variant", "seed", "value"],
              ((variant, seed, mean + noise)
               for variant, mean in [("baseline", 50), ("ours", 54), ("removed", 47)]
               for seed, noise in enumerate([-0.6, -0.2, 0, 0.3, 0.5])))
    write_csv(root, "pareto.csv", ["method", "setting", "seed", "kl", "reward"],
              ((method, setting, seed, 0.04 + 0.05 * setting + seed * 0.004,
                shift + 0.1 * setting + seed * 0.006)
               for method, shift in [("GRPO", 0.2), ("ES", 0.3)]
               for setting in range(8) for seed in range(3)))
    write_csv(root, "sweep.csv", ["lr", "batch_size", "loss"],
              ((lr, batch, "" if i == 0 and j == 0 else 1.5 + 0.03 * (i - 2) ** 2 + 0.02 * (j - 2) ** 2)
               for i, lr in enumerate([0.0001, 0.0003, 0.001, 0.003, 0.01])
               for j, batch in enumerate([8, 16, 32, 64, 128])))
    with (root / "confusion.npy").open("xb") as handle:
        np.save(handle, np.array([[80, 12, 8], [7, 84, 9], [3, 14, 83]]))
    assert all((root / name).is_file() for name in names)
    print("SOFTWARE DEMONSTRATION data created; replace before research delivery.")


if __name__ == "__main__":
    main()
