'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

export default function AnalysisPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [result, setResult] = useState<ModelResult | null>(null);
  const [metric, setMetric] = useState<MetricResult | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedTranscript = window.localStorage.getItem('soap_transcript') ?? '';
    const storedReference = window.localStorage.getItem('soap_reference') ?? '';
    const storedResultsRaw = window.localStorage.getItem('soap_results');
    const storedMetricsRaw = window.localStorage.getItem('soap_metrics');

    setTranscript(storedTranscript);
    setReference(storedReference);

    if (storedResultsRaw) {
      try {
        const parsed = JSON.parse(storedResultsRaw) as ModelResult[];
        setResult(parsed[0] ?? null);
      } catch (err) {
        console.error('Failed to parse stored SOAP results on analysis page', err);
      }
    }

    if (storedMetricsRaw) {
      try {
        const parsed = JSON.parse(storedMetricsRaw) as MetricResult[];
        setMetric(parsed[0] ?? null);
      } catch (err) {
        console.error('Failed to parse stored SOAP metrics on analysis page', err);
      }
    }
  }, []);

  const hasData = !!result && !!metric;

  const chartData = useMemo(
    () =>
      metric
        ? [
            { metric: 'ROUGE-1', value: metric.rouge1 },
            { metric: 'BLEU-1', value: metric.bleu1 },
            { metric: 'Combined', value: metric.combined },
          ]
        : [],
    [metric],
  );

  const handleBackToResults = () => {
    router.push('/results');
  };

  const handleDownloadResults = () => {
    if (!result || !metric) return;

    const payload = {
      generatedAt: new Date().toISOString(),
      model: result.model,
      provider: result.provider,
      transcript,
      reference,
      soapNote: result.note,
      metrics: {
        rouge1: metric.rouge1,
        bleu1: metric.bleu1,
        combined: metric.combined,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soap_evaluation_results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 py-16 text-zinc-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_55%)]" />
      <div className="mx-auto w-full max-w-[90rem] space-y-8 px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl">
              Evaluation analysis
            </h1>
            <p className="text-sm text-zinc-400">
              Visual overview of how the generated SOAP note aligns with the reference.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleBackToResults}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs font-semibold text-zinc-100 shadow-md shadow-black/40 transition hover:bg-black/60"
            >
              Back to results
            </button>
            <button
              type="button"
              onClick={handleDownloadResults}
              disabled={!hasData}
              className="rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download results (JSON)
            </button>
          </div>
        </div>

        {!hasData && (
          <div className="rounded-3xl border border-amber-200/60 bg-amber-950/30 p-4 text-sm text-amber-100">
            No evaluation data found. Please generate a SOAP note, run Evaluate, then return to this
            page.
          </div>
        )}

        {hasData && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(0,1.1fr)]">
            <section className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5 shadow-2xl shadow-black/40">
              <h2 className="text-sm font-semibold uppercase tracking-[0.25rem] text-emerald-300">
                Scores
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-300/30 bg-emerald-900/30 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16rem] text-emerald-200">
                    Combined
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-100">
                    {(metric!.combined * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-300/30 bg-sky-900/30 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16rem] text-sky-200">
                    ROUGE-1
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-sky-100">
                    {(metric!.rouge1 * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-2xl border border-purple-300/30 bg-purple-900/30 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16rem] text-purple-200">
                    BLEU-1
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-purple-100">
                    {(metric!.bleu1 * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 h-72 w-full rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/90 to-emerald-950/60 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} outerRadius="70%">
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#e4e4e7', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} domain={[0, 1]} />
                    <Tooltip
                      formatter={(val: number) => `${(val * 100).toFixed(1)}%`}
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid rgba(244,244,245,0.15)',
                        borderRadius: '0.75rem',
                        fontSize: '0.75rem',
                      }}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.45}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5 shadow-2xl shadow-black/40">
              <h2 className="text-sm font-semibold uppercase tracking-[0.25rem] text-zinc-300">
                Summary
              </h2>
              <p className="text-xs text-zinc-300">
                This view compares the generated SOAP note against the reference using ROUGE-1 and
                BLEU-1. The combined score is a simple average of the two and provides a quick
                sense of lexical alignment.
              </p>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16rem] text-zinc-400">
                  Model
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-50">{result?.model}</p>
                {result?.provider && (
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    Provider: {result.provider === 'gemini' ? 'Gemini' : 'OpenAI'}
                  </p>
                )}
              </div>

              <div className="grid gap-3 text-xs text-zinc-200 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16rem] text-zinc-400">
                    Transcript
                  </p>
                  <p className="mt-1 line-clamp-5 text-[11px] text-zinc-300">{transcript}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16rem] text-zinc-400">
                    Reference SOAP
                  </p>
                  <p className="mt-1 line-clamp-5 text-[11px] text-zinc-300">{reference}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16rem] text-zinc-400">
                  Generated SOAP
                </p>
                <p className="mt-1 line-clamp-7 text-[11px] text-zinc-300">{result?.note}</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
