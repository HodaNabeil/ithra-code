#!/usr/bin/env python3
import json
import sys


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: ragas_eval.py <dataset.json> <output.json>", file=sys.stderr)
        return 1

    dataset_path, output_path = sys.argv[1], sys.argv[2]
    with open(dataset_path, "r", encoding="utf-8") as handle:
        dataset = json.load(handle)

    samples = dataset.get("samples", [])
    if not samples:
        print("dataset has no samples", file=sys.stderr)
        return 1

    # Real evaluation when the `ragas` package is installed (CI installs it
    # from eval/requirements.txt). If it isn't available, this loudly reports
    # a fallback instead of silently pretending the placeholder metrics below
    # are a real Ragas evaluation — callers (ragas-runner.ts) surface
    # `usedFallback` and warn/fail accordingly.
    used_fallback = False
    try:
        from ragas import evaluate  # type: ignore
        from ragas.metrics import (  # type: ignore
            faithfulness,
            answer_relevancy,
            context_precision,
            context_recall,
        )

        result = evaluate(
            dataset=samples,
            metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
        )
        metrics = {
            "faithfulness": float(result["faithfulness"]),
            "answerRelevancy": float(result["answer_relevancy"]),
            "contextPrecision": float(result["context_precision"]),
            "contextRecall": float(result["context_recall"]),
        }
    except Exception as error:  # noqa: BLE001 - intentionally broad, reported below
        used_fallback = True
        print(
            "[ragas_eval.py] WARNING: could not run real ragas evaluation "
            f"({error.__class__.__name__}: {error}). Install eval/requirements.txt "
            "for real metrics. Emitting placeholder metrics tagged usedFallback=true.",
            file=sys.stderr,
        )
        metrics = {
            "faithfulness": 0.9,
            "answerRelevancy": 0.85,
            "contextPrecision": 0.8,
            "contextRecall": 0.75,
        }

    payload = {
        "metrics": metrics,
        "perSample": [],
        "durationMs": 0,
        "passed": True,
        "usedFallback": used_fallback,
    }

    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
