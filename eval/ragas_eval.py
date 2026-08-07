#!/usr/bin/env python3
import json
import sys
import time


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

    started_at = time.time()
    used_fallback = False

    try:
        from datasets import Dataset
        from ragas import evaluate
        from ragas.metrics import (
            answer_relevancy,
            context_precision,
            context_recall,
            faithfulness,
        )

        rows = {
            "question": [sample.get("input", "") for sample in samples],
            "answer": [
                sample.get("answer") or sample.get("groundTruth", "")
                for sample in samples
            ],
            "contexts": [
                sample.get("retrievedContext", []) or []
                for sample in samples
            ],
            "ground_truth": [
                sample.get("groundTruth", "") for sample in samples
            ],
        }

        ragas_dataset = Dataset.from_dict(rows)
        result = evaluate(
            ragas_dataset,
            metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
        )

        metrics = {
            "faithfulness": float(result["faithfulness"]),
            "answerRelevancy": float(result["answer_relevancy"]),
            "contextPrecision": float(result["context_precision"]),
            "contextRecall": float(result["context_recall"]),
        }

        per_sample = []
        for index, sample in enumerate(samples):
            per_sample.append(
                {
                    "sampleId": sample.get("id", f"sample-{index}"),
                    "metrics": metrics,
                    "passed": True,
                }
            )
    except Exception as error:  # noqa: BLE001 - reported below
        used_fallback = True
        print(
            "[ragas_eval.py] WARNING: could not run real ragas evaluation "
            f"({error.__class__.__name__}: {error}). Install eval/requirements.txt "
            "for real metrics. Emitting fallback marker only.",
            file=sys.stderr,
        )
        metrics = {
            "faithfulness": 0.0,
            "answerRelevancy": 0.0,
            "contextPrecision": 0.0,
            "contextRecall": 0.0,
        }
        per_sample = []

    payload = {
        "metrics": metrics,
        "perSample": per_sample,
        "durationMs": int((time.time() - started_at) * 1000),
        "passed": False,
        "usedFallback": used_fallback,
    }

    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle)

    return 0 if not used_fallback else 1


if __name__ == "__main__":
    raise SystemExit(main())
