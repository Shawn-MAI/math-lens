"""Generate tests/fixtures/reference-values.json with NumPy (test case A3-16).

Run from the repository root:  python3 tests/fixtures/generate_reference.py
The output is committed so the TypeScript tests do not need Python.
"""

import json
from pathlib import Path

import numpy as np

DATASETS = {
    "loss-3": ([1, 2, 3], [2, 4, 5]),
    "weight-bias-4": ([1, 2, 3, 4], [3, 5, 7, 8]),
}

# Hand-calculated values from test-cases.md (A3-02 to A3-07). The script refuses to write
# the file if NumPy disagrees with them.
HAND_CHECKS = [
    ("loss-3", 2.0, 0.0, 1 / 3),
    ("loss-3", 1.0, 0.0, 3.0),
    ("loss-3", 1.5, 0.5, None),
    ("weight-bias-4", 1.0, 0.0, None),
]


def mse(dataset_id: str, slope: float, intercept: float) -> float:
    xs, ys = DATASETS[dataset_id]
    x = np.array(xs, dtype=np.float64)
    y = np.array(ys, dtype=np.float64)
    return float(np.mean((slope * x + intercept - y) ** 2))


def main() -> None:
    for dataset_id, slope, intercept, expected in HAND_CHECKS:
        if expected is not None:
            actual = mse(dataset_id, slope, intercept)
            assert abs(actual - expected) < 1e-12, (dataset_id, slope, intercept, actual, expected)

    rng = np.random.default_rng(20261105)
    pairs = [
        (round(float(rng.uniform(-3, 3)), 1), round(float(rng.uniform(-5, 5)), 1))
        for _ in range(20)
    ]

    cases = [
        {
            "dataset": dataset_id,
            "slope": slope,
            "intercept": intercept,
            "mse": mse(dataset_id, slope, intercept),
        }
        for dataset_id in DATASETS
        for slope, intercept in pairs
    ]

    out = {
        "description": "NumPy reference MSE for random (slope, intercept) pairs. Error = prediction - actual.",
        "numpyVersion": np.__version__,
        "tolerance": 1e-9,
        "datasets": {k: {"x": v[0], "y": v[1]} for k, v in DATASETS.items()},
        "cases": cases,
    }

    path = Path(__file__).with_name("reference-values.json")
    path.write_text(json.dumps(out, indent=2) + "\n")
    print(f"wrote {len(cases)} cases to {path}")


if __name__ == "__main__":
    main()
