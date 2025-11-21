'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ModelResult = {
  id: string;
  provider: 'openai' | 'gemini';
  model: string;
  label: string;
  note: string | null;
  error?: string;
};

type MetricResult = {
  id: string;
  label: string;
  rouge1: number;
  bleu1: number;
  combined: number;
};

export default function ResultsPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [hasReference, setHasReference] = useState<boolean>(false);

  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [metrics, setMetrics] = useState<MetricResult[]>([]);

  const [loadingGenerate, setLoadingGenerate] = useState<boolean>(false);
  const [loadingEvaluate, setLoadingEvaluate] = useState<boolean>(false);
  const [errorGenerate, setErrorGenerate] = useState<string | null>(null);
  const [errorEvaluate, setErrorEvaluate] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedTranscript = window.localStorage.getItem('soap_transcript') ?? '';
    const storedReference = window.localStorage.getItem('soap_reference') ?? '';
    const storedHasReference = window.localStorage.getItem('soap_has_reference');
    const storedModel = window.localStorage.getItem('soap_model') ?? '';
    const storedResultsRaw = window.localStorage.getItem('soap_results');
    const storedMetricsRaw = window.localStorage.getItem('soap_metrics');

    setTranscript(storedTranscript);
    setReference(storedReference);
    setHasReference(storedHasReference === 'true');

    if (storedResultsRaw) {
      try {
        const parsed = JSON.parse(storedResultsRaw) as ModelResult[];
        setModelResults(parsed);
      } catch (err) {
        console.error('Failed to parse stored SOAP results', err);
      }
    }

    if (storedMetricsRaw) {
      try {
        const parsed = JSON.parse(storedMetricsRaw) as MetricResult[];
        setMetrics(parsed);
      } catch (err) {
        console.error('Failed to parse stored SOAP metrics', err);
      }
    }

    const shouldGenerate = !!storedTranscript && !!storedModel && !storedResultsRaw;

    if (!shouldGenerate) {
      return;
    }

    const generateAll = async () => {
      try {
        setLoadingGenerate(true);
        setErrorGenerate(null);

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript: storedTranscript,
            reference: storedReference || null,
            model: storedModel,
          }),
        });

        if (!res.ok) {
          const text = await res.text();

          const lower = text.toLowerCase();
          const isQuotaIssue =
            res.status === 429 ||
            lower.includes('insufficient_quota') ||
            lower.includes('rate limit') ||
            lower.includes('quota');

          if (isQuotaIssue) {
            const provider: 'openai' | 'gemini' =
              storedModel && storedModel.includes('gemini') ? 'gemini' : 'openai';

            const subscriptionNote =
              'SOAP generation is currently unavailable because your model quota has been exhausted. You are not subscribed to a paid user plan. Buy a SOAP paid subscription to access unlimited quota.';

            const quotaResult: ModelResult = {
              id: storedModel || 'quota-exceeded',
              provider,
              model: storedModel || 'unknown-model',
              label: storedModel || 'Model',
              note: subscriptionNote,
              error: text || 'Quota exceeded',
            };

            setModelResults([quotaResult]);

            try {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('soap_results', JSON.stringify([quotaResult]));
                window.localStorage.setItem('soap_generation_in_progress', 'false');
              }
            } catch (err) {
              console.error('Failed to store quota result', err);
            }

            setErrorGenerate(null);
            return;
          }

          throw new Error(text || 'Failed to generate notes');
        }

        const data = (await res.json()) as { message?: string | null; modelUsed?: string };
        const note = data.message ?? null;

        // ✅ FIXED — Correct Gemini detection
        const provider: 'openai' | 'gemini' =
          storedModel.includes('gemini') ? 'gemini' : 'openai';

        const singleResult: ModelResult = {
          id: storedModel,
          provider,
          model: storedModel,
          label: data.modelUsed || storedModel,
          note,
        };

        setModelResults([singleResult]);

        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('soap_results', JSON.stringify([singleResult]));
            window.localStorage.setItem('soap_generation_in_progress', 'false');
          }
        } catch (err) {
          console.error('Failed to store SOAP results', err);
        }
      } catch (err: any) {
        console.error('Error generating SOAP notes', err);
        setErrorGenerate(err?.message || 'Failed to generate SOAP notes.');
      } finally {
        setLoadingGenerate(false);
      }
    };

    generateAll();
  }, []);

  const handleEvaluate = async () => {
    if (!reference) {
      setErrorEvaluate('Upload a reference SOAP note to evaluate.');
      return;
    }

    const validCandidates = modelResults.filter((m) => m.note && !m.error);
    if (validCandidates.length === 0) {
      setErrorEvaluate('No valid model outputs to evaluate.');
      return;
    }

    try {
      setLoadingEvaluate(true);
      setErrorEvaluate(null);

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference,
          candidates: validCandidates.map((m) => ({
            id: m.id,
            label: m.label,
            text: m.note as string,
          })),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to evaluate');
      }

      const data = (await res.json()) as { metrics?: MetricResult[] };
      const metrics = data.metrics ?? [];
      setMetrics(metrics);

      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('soap_metrics', JSON.stringify(metrics));
          window.localStorage.setItem('soap_evaluation_in_progress', 'false');
        }
      } catch (err) {
        console.error('Failed to store SOAP metrics', err);
      }

      // Navigate to analysis page once evaluation is complete
      if (metrics.length > 0) {
        router.push('/analysis');
      }
    } catch (err: any) {
      console.error('Error evaluating SOAP notes', err);
      setErrorEvaluate(err?.message || 'Failed to evaluate SOAP notes.');
    } finally {
      setLoadingEvaluate(false);
    }
  };

  const handleReferenceChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('soap_reference', text);
        window.localStorage.setItem('soap_has_reference', 'true');
      }
    } catch (err) {
      console.error('Failed to store reference file', err);
    }

    setReference(text);
    setHasReference(true);
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-emerald-900 py-16 text-zinc-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_50%)]" />
      <div className="mx-auto w-full max-w-[90rem] space-y-8 px-6">
        <div className="space-y-2 lg:ml-auto lg:max-w-5xl">
          <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl">
            SOAP Note Preview
          </h1>
          <p className="text-sm text-zinc-400">
            Left: Uploaded transcript. Right: Generated SOAP note. Both panels are scrollable.
          </p>
        </div>

        {errorGenerate && (
          <div className="rounded-3xl border border-red-200 bg-red-950/40 p-4 text-sm text-red-100">
            {errorGenerate}
          </div>
        )}

        <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur lg:grid-cols-2">
          <section className="flex flex-col">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.25rem] text-emerald-300">
              Transcript
            </h2>
            <div className="min-h-[20rem] max-h-[40rem] flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-100">
              {transcript ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs sm:text-sm">
                  {transcript}
                </pre>
              ) : (
                <p className="text-xs text-zinc-500">No transcript found. Please go back and upload a transcript.</p>
              )}
            </div>
          </section>

          <section className="flex flex-col space-y-4">
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.25rem] text-sky-300">
                SOAP Note
              </h2>
              <div className="min-h-[20rem] max-h-[40rem] flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-100">
                {modelResults.length > 0 ? (
                  (() => {
                    const primary = modelResults.find((m) => !m.error && m.note) || modelResults[0];
                    if (!primary || !primary.note) {
                      return (
                        <p className="text-xs text-zinc-500">
                          No valid SOAP note available. Please try generating again.
                        </p>
                      );
                    }
                    return (
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs sm:text-sm">
                        {primary.note}
                      </pre>
                    );
                  })()
                ) : loadingGenerate ? (
                  <p className="text-xs text-zinc-500">Generating SOAP note…</p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    No SOAP note yet. Please go back, upload a transcript, and generate notes.
                  </p>
                )}
              </div>
            </div>

            {metrics.length > 0 && (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16rem] text-zinc-300">
                  Evaluation metrics
                </p>
                {(() => {
                  const m = metrics[0];
                  if (!m) return null;
                  return (
                    <div className="flex flex-wrap gap-2 text-[11px] text-zinc-200">
                      <span className="rounded-full bg-emerald-900/60 px-2 py-0.5">
                        ROUGE-1: {(m.rouge1 * 100).toFixed(1)}%
                      </span>
                      <span className="rounded-full bg-sky-900/60 px-2 py-0.5">
                        BLEU-1: {(m.bleu1 * 100).toFixed(1)}%
                      </span>
                      <span className="rounded-full bg-purple-900/60 px-2 py-0.5">
                        Score: {(m.combined * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </section>
        </div>

        {errorEvaluate && (
          <div className="mt-4 rounded-3xl border border-red-200 bg-red-950/40 p-4 text-sm text-red-100">
            {errorEvaluate}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 rounded-3xl border border-white/10 bg-black/30 p-4">
          <button
            type="button"
            onClick={handleEvaluate}
            disabled={!hasReference || loadingGenerate || loadingEvaluate}
            className="rounded-2xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingEvaluate ? 'Evaluating…' : 'Evaluate'}
          </button>

          <label
            htmlFor="results-reference-input"
            className={`cursor-pointer rounded-2xl bg-zinc-800/70 px-6 py-2 text-sm font-semibold text-zinc-100 shadow-md shadow-black/40 transition hover:bg-zinc-700 ${
              loadingGenerate || loadingEvaluate ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            {hasReference ? 'Update reference file' : 'Upload reference file'}
            <input
              id="results-reference-input"
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleReferenceChange}
              disabled={loadingGenerate || loadingEvaluate}
            />
          </label>
        </div>
      </div>
    </main>
  );
}
