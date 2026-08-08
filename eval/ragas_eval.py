#!/usr/bin/env python3
import asyncio
import json
import os
import sys
import time


def average(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


async def evaluate_samples(samples: list[dict]) -> tuple[dict[str, float], list[dict]]:
    from openai import AsyncOpenAI

    from ragas.embeddings.base import embedding_factory
    from ragas.llms import llm_factory
    from ragas.metrics.collections import (
        AnswerRelevancy,
        ContextPrecisionWithReference,
        ContextRecall,
        Faithfulness,
    )

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required for Ragas evaluation")

    client = AsyncOpenAI(api_key=api_key)
    llm = llm_factory("gpt-4o-mini", client=client, max_tokens=4096)
    embeddings = embedding_factory(
        "openai",
        model="text-embedding-3-small",
        client=client,
        interface="modern",
    )

    faithfulness_metric = Faithfulness(llm=llm)
    answer_relevancy_metric = AnswerRelevancy(
        llm=llm,
        embeddings=embeddings,
        strictness=1,
    )
    context_precision_metric = ContextPrecisionWithReference(llm=llm)
    context_recall_metric = ContextRecall(llm=llm)

    per_sample: list[dict] = []

    for index, sample in enumerate(samples):
        question = sample.get("input", "")
        answer = sample.get("answer") or sample.get("groundTruth", "")
        contexts = sample.get("retrievedContext", []) or []
        ground_truth = sample.get("groundTruth", "")

        faith_result = await faithfulness_metric.ascore(
            user_input=question,
            response=answer,
            retrieved_contexts=contexts,
        )
        relevancy_result = await answer_relevancy_metric.ascore(
            user_input=question,
            response=answer,
        )
        precision_result = await context_precision_metric.ascore(
            user_input=question,
            reference=ground_truth,
            retrieved_contexts=contexts,
        )
        recall_result = await context_recall_metric.ascore(
            user_input=question,
            retrieved_contexts=contexts,
            reference=ground_truth,
        )

        sample_metrics = {
            "faithfulness": float(faith_result.value),
            "answerRelevancy": float(relevancy_result.value),
            "contextPrecision": float(precision_result.value),
            "contextRecall": float(recall_result.value),
        }

        per_sample.append(
            {
                "sampleId": sample.get("id", f"sample-{index}"),
                "metrics": sample_metrics,
                "passed": True,
            }
        )

    metrics = {
        "faithfulness": average([row["metrics"]["faithfulness"] for row in per_sample]),
        "answerRelevancy": average(
            [row["metrics"]["answerRelevancy"] for row in per_sample]
        ),
        "contextPrecision": average(
            [row["metrics"]["contextPrecision"] for row in per_sample]
        ),
        "contextRecall": average([row["metrics"]["contextRecall"] for row in per_sample]),
    }

    return metrics, per_sample


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
        metrics, per_sample = asyncio.run(evaluate_samples(samples))
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
