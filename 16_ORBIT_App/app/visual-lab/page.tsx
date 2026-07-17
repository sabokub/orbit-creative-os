"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CommandIcon from "@/components/CommandIcon";
import { VISUAL_FIXTURES } from "@/lib/promptIntelligence/visual/fixtures";
import {
  CompiledVisualPrompt,
  CreativeIntent,
  GenerationRecord,
  PromptLearning,
  VisualCompilation,
  VisualGenerator,
  VisualReview,
} from "@/lib/promptIntelligence/visual/contracts";

const LABELS: Record<VisualGenerator, string> = {
  "gpt-image": "GPT Image",
  "nano-banana": "Nano Banana",
  midjourney: "Midjourney",
  sora: "Sora",
};

type StoredState = {
  prompts: CompiledVisualPrompt[];
  generations: GenerationRecord[];
  reviews: VisualReview[];
  learnings: PromptLearning[];
};

const EMPTY_STORED: StoredState = { prompts: [], generations: [], reviews: [], learnings: [] };

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  return data as T;
}

export default function VisualLabPage() {
  const [intent, setIntent] = useState<CreativeIntent>(VISUAL_FIXTURES[0]);
  const [result, setResult] = useState<VisualCompilation | null>(null);
  const [stored, setStored] = useState<StoredState>(EMPTY_STORED);
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [selectedGenerationId, setSelectedGenerationId] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedPrompt = useMemo(
    () => [...(result?.prompts ?? []), ...stored.prompts].find((prompt) => prompt.id === selectedPromptId),
    [result, selectedPromptId, stored.prompts]
  );

  const errors = useMemo(
    () => result?.prompts.flatMap((prompt) => prompt.issues.filter((issue) => issue.severity === "error")) ?? [],
    [result]
  );

  const refreshStored = useCallback(async (projectId = intent.projectId) => {
    try {
      const [prompts, generations, reviews] = await Promise.all([
        fetch(`/api/prompt-intelligence/visual/prompts?projectId=${encodeURIComponent(projectId)}`).then(
          (response) => readJson<{ prompts: CompiledVisualPrompt[] }>(response)
        ),
        fetch(`/api/prompt-intelligence/visual/generations?projectId=${encodeURIComponent(projectId)}`).then(
          (response) => readJson<{ generations: GenerationRecord[] }>(response)
        ),
        fetch(`/api/prompt-intelligence/visual/reviews?projectId=${encodeURIComponent(projectId)}`).then(
          (response) => readJson<{ reviews: VisualReview[]; learnings: PromptLearning[] }>(response)
        ),
      ]);
      setStored({ prompts: prompts.prompts, generations: generations.generations, reviews: reviews.reviews, learnings: reviews.learnings });
    } catch {
      setStored(EMPTY_STORED);
    }
  }, [intent.projectId]);

  useEffect(() => {
    void refreshStored(intent.projectId);
  }, [intent.projectId, refreshStored]);

  async function compile() {
    setLoading("compile");
    setError("");
    setMessage("");
    try {
      const data = await fetch("/api/prompt-intelligence/visual/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intent),
      }).then((response) => readJson<VisualCompilation>(response));
      setResult(data);
      setSelectedPromptId(data.prompts[0]?.id ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compilation failed");
    } finally {
      setLoading("");
    }
  }

  async function savePrompt(prompt: CompiledVisualPrompt) {
    setLoading(`save-${prompt.id}`);
    setMessage("");
    setError("");
    try {
      await fetch("/api/prompt-intelligence/visual/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      }).then((response) => readJson(response));
      setMessage("Prompt saved.");
      await refreshStored(prompt.projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save prompt");
    } finally {
      setLoading("");
    }
  }

  async function createGeneration(prompt: CompiledVisualPrompt) {
    await savePrompt(prompt);
    setLoading(`generation-${prompt.id}`);
    setError("");
    try {
      const data = await fetch("/api/prompt-intelligence/visual/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id }),
      }).then((response) => readJson<{ generation: GenerationRecord }>(response));
      setSelectedGenerationId(data.generation.id);
      setMessage("External generation ready. Copy the prompt, run it, then import the result.");
      await refreshStored(prompt.projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create generation");
    } finally {
      setLoading("");
    }
  }

  async function attachAsset() {
    if (!selectedGenerationId) return;
    setLoading("asset");
    setError("");
    try {
      await fetch(`/api/prompt-intelligence/visual/generations/${selectedGenerationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetUrl }),
      }).then((response) => readJson(response));
      setAssetUrl("");
      setMessage("Result imported.");
      await refreshStored();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import result");
    } finally {
      setLoading("");
    }
  }

  async function submitReview(decision: VisualReview["decision"]) {
    if (!selectedGenerationId) return;
    setLoading("review");
    setError("");
    try {
      await fetch("/api/prompt-intelligence/visual/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: selectedGenerationId,
          whatWorked: decision === "approved" ? [reviewNote || "Result accepted"] : [],
          whatFailed: decision !== "approved" ? [reviewNote || "Needs correction"] : [],
          visualDrift: [],
          correctionInstructions: decision === "approved" ? [] : [reviewNote || "Refine the next prompt version"],
          decision,
          learningObservation: reviewNote || undefined,
        }),
      }).then((response) => readJson(response));
      setReviewNote("");
      setMessage("Review saved. Learning is proposed, not auto-applied.");
      await refreshStored();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save review");
    } finally {
      setLoading("");
    }
  }

  async function approveAndProject(prompt: CompiledVisualPrompt) {
    await savePrompt(prompt);
    setLoading(`approve-${prompt.id}`);
    setError("");
    try {
      await fetch(`/api/prompt-intelligence/visual/prompts/${prompt.id}/approve`, { method: "POST" }).then((response) =>
        readJson(response)
      );
      setMessage("Prompt approved and projected to Studio Brain.");
      await refreshStored(prompt.projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to project prompt");
    } finally {
      setLoading("");
    }
  }

  function toggleGenerator(generator: VisualGenerator) {
    setIntent((value) => ({
      ...value,
      generators: value.generators.includes(generator)
        ? value.generators.filter((item) => item !== generator)
        : [...value.generators, generator],
    }));
  }

  return (
    <div className="space-y-5 pb-12">
      <header>
        <span className="command-label">
          <CommandIcon name="sparkles" className="h-3.5 w-3.5" /> Prompt Intelligence
        </span>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Visual Lab multi-generators</h1>
        <p className="mt-1 max-w-3xl text-sm font-medium text-black/48">
          One creative intent, one canonical visual spec, controlled adapters, external generation, review, learning and Studio Brain projection.
        </p>
      </header>

      <section className="command-card p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_.8fr]">
          <div>
            <label className="command-label">Creative intent</label>
            <textarea
              aria-label="Creative intent"
              className="mt-2 min-h-28 w-full rounded-[18px] border border-black/10 bg-white/70 p-4 text-sm font-medium outline-none focus:border-black/30"
              value={intent.rawRequest}
              onChange={(event) => setIntent((value) => ({ ...value, rawRequest: event.target.value, objective: event.target.value }))}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                aria-label="Subject"
                className="rounded-xl border border-black/10 bg-white p-3 text-sm"
                value={intent.subject}
                onChange={(event) => setIntent((value) => ({ ...value, subject: event.target.value }))}
              />
              <input
                aria-label="Environment"
                className="rounded-xl border border-black/10 bg-white p-3 text-sm"
                value={intent.environment}
                onChange={(event) => setIntent((value) => ({ ...value, environment: event.target.value }))}
              />
            </div>
          </div>
          <div>
            <p className="command-label">Starter profile</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {VISUAL_FIXTURES.map((fixture) => (
                <button
                  key={fixture.id}
                  onClick={() => {
                    setIntent(fixture);
                    setResult(null);
                    setSelectedPromptId("");
                  }}
                  className="command-pill hover:bg-black hover:text-white"
                >
                  {fixture.objective}
                </button>
              ))}
            </div>
            <p className="mt-5 command-label">Generators</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(LABELS) as VisualGenerator[]).map((generator) => (
                <button
                  key={generator}
                  onClick={() => toggleGenerator(generator)}
                  className={`rounded-xl border p-3 text-left text-xs font-black ${
                    intent.generators.includes(generator) ? "border-black bg-black text-white" : "border-black/10 bg-white"
                  }`}
                >
                  {LABELS[generator]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button disabled={loading === "compile" || intent.generators.length === 0} onClick={compile} className="command-button">
            {loading === "compile" ? "Compiling..." : "Compile and compare"}
          </button>
          <span className="text-xs text-black/45">
            {intent.projectId} | {intent.assetType} | {intent.aspectRatio}
          </span>
        </div>
        {error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}
        {message && <p className="mt-3 text-sm font-bold text-green-700">{message}</p>}
      </section>

      {result && (
        <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
          <article className="command-card p-5">
            <p className="command-label">Canonical visual spec</p>
            <h2 className="mt-2 text-xl font-black">{result.spec.direction.concept}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="font-black">Subject</dt><dd className="text-black/55">{result.spec.subject.description}</dd></div>
              <div><dt className="font-black">Composition</dt><dd className="text-black/55">{result.spec.composition.hierarchy}</dd></div>
              <div><dt className="font-black">Light</dt><dd className="text-black/55">{result.spec.lighting.quality}</dd></div>
              <div><dt className="font-black">Invariants</dt><dd className="text-black/55">{result.spec.invariants.join(", ") || "None"}</dd></div>
            </dl>
          </article>
          <article className="command-card p-5">
            <div className="flex justify-between gap-3">
              <div>
                <p className="command-label">Validation</p>
                <h2 className="mt-2 text-xl font-black">Specification quality</h2>
              </div>
              <span className={`command-pill ${errors.length ? "bg-red-100" : "bg-[#d9f2df]"}`}>
                {errors.length ? `${errors.length} blocker(s)` : "Ready"}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {result.prompts[0]?.issues.map((issue) => (
                <p key={issue.code} className="rounded-xl bg-black/[.04] p-3 text-xs font-semibold">
                  <b>{issue.severity}</b> - {issue.message}
                </p>
              ))}
              {!result.prompts[0]?.issues.length && <p className="text-sm text-black/50">No contradiction detected.</p>}
            </div>
          </article>
        </section>
      )}

      {result && (
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="command-label">Comparison</p>
              <h2 className="mt-1 text-2xl font-black">Compiled prompts</h2>
            </div>
            <span className="text-xs font-bold text-black/40">Server versioning | external generation</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {result.prompts.map((prompt) => (
              <article key={prompt.id} className="command-card min-w-0 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-black">{LABELS[prompt.generator]}</h3>
                  <span className="command-pill bg-[#cfc5f4]/55">Fit {prompt.score.generatorFit}%</span>
                </div>
                <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-[16px] bg-black/[.035] p-4 text-xs leading-relaxed">
                  {prompt.body}
                </pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(prompt.parameters).map(([key, value]) => (
                    <span key={key} className="command-pill">{key}: {String(value)}</span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => navigator.clipboard.writeText(prompt.body)} className="command-button">Copy</button>
                  <button onClick={() => savePrompt(prompt)} className="command-button bg-white text-black">
                    {loading === `save-${prompt.id}` ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => createGeneration(prompt)} className="command-button bg-white text-black">
                    {loading === `generation-${prompt.id}` ? "Preparing..." : "External run"}
                  </button>
                  <button onClick={() => approveAndProject(prompt)} className="command-button bg-white text-black">
                    {loading === `approve-${prompt.id}` ? "Projecting..." : "Approve"}
                  </button>
                </div>
                <p className="mt-3 text-[11px] font-semibold text-black/45">{prompt.explanation.join(" | ")}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="command-card p-5">
          <p className="command-label">Saved prompts</p>
          <h2 className="mt-1 text-xl font-black">{stored.prompts.length} version(s)</h2>
          <div className="mt-4 space-y-2">
            {stored.prompts.slice(0, 6).map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => setSelectedPromptId(prompt.id)}
                className={`w-full rounded-xl border p-3 text-left text-xs font-bold ${
                  selectedPromptId === prompt.id ? "border-black bg-black text-white" : "border-black/10 bg-white"
                }`}
              >
                {LABELS[prompt.generator]} | v{prompt.version} | {prompt.status}
              </button>
            ))}
            {!stored.prompts.length && <p className="text-sm text-black/45">No saved prompt yet.</p>}
          </div>
        </article>

        <article className="command-card p-5">
          <p className="command-label">Generation result</p>
          <h2 className="mt-1 text-xl font-black">{stored.generations.length} external run(s)</h2>
          <div className="mt-4 space-y-2">
            {stored.generations.slice(0, 5).map((generation) => (
              <button
                key={generation.id}
                onClick={() => setSelectedGenerationId(generation.id)}
                className={`w-full rounded-xl border p-3 text-left text-xs font-bold ${
                  selectedGenerationId === generation.id ? "border-black bg-black text-white" : "border-black/10 bg-white"
                }`}
              >
                {LABELS[generation.generator]} | {generation.status}
              </button>
            ))}
          </div>
          <input
            aria-label="Asset URL"
            className="mt-4 w-full rounded-xl border border-black/10 bg-white p-3 text-sm"
            placeholder="Paste result URL or stable reference"
            value={assetUrl}
            onChange={(event) => setAssetUrl(event.target.value)}
          />
          <button disabled={!selectedGenerationId || !assetUrl} onClick={attachAsset} className="mt-3 command-button">
            {loading === "asset" ? "Importing..." : "Import result"}
          </button>
        </article>

        <article className="command-card p-5">
          <p className="command-label">Review and learning</p>
          <h2 className="mt-1 text-xl font-black">{stored.reviews.length} review(s)</h2>
          <textarea
            aria-label="Review note"
            className="mt-4 min-h-24 w-full rounded-xl border border-black/10 bg-white p-3 text-sm"
            placeholder="What worked, what failed, or what Orbit should remember as a proposed learning."
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={!selectedGenerationId} onClick={() => submitReview("approved")} className="command-button">Approve result</button>
            <button disabled={!selectedGenerationId} onClick={() => submitReview("revise")} className="command-button bg-white text-black">Revise</button>
            <button disabled={!selectedGenerationId} onClick={() => submitReview("rejected")} className="command-button bg-white text-black">Reject</button>
          </div>
          <p className="mt-3 text-xs font-semibold text-black/45">{stored.learnings.length} proposed learning(s), approval required before reuse.</p>
        </article>
      </section>

      {selectedPrompt && (
        <section className="command-card p-5">
          <p className="command-label">Active prompt</p>
          <h2 className="mt-1 text-xl font-black">{LABELS[selectedPrompt.generator]} | {selectedPrompt.status}</h2>
          <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-[16px] bg-black/[.035] p-4 text-xs leading-relaxed">
            {selectedPrompt.body}
          </pre>
        </section>
      )}
    </div>
  );
}
