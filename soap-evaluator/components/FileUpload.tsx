'use client';

import { useState } from 'react';

const modelOptions = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'custom', label: 'Custom Model' },
];

export default function FileUpload() {
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0].id);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateTextFile = (file: File | null) => {
    return file ? file.name.toLowerCase().endsWith('.txt') : false;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'transcript' | 'reference',
  ) => {
    if (!e.target.files || !e.target.files[0]) return;

    const incoming = e.target.files[0];
    if (!validateTextFile(incoming)) {
      setError('Only .txt files are supported right now.');
      if (type === 'transcript') {
        setTranscriptFile(null);
      } else {
        setReferenceFile(null);
      }
      return;
    }

    setError(null);
    setResponse(null);
    if (type === 'transcript') {
      setTranscriptFile(incoming);
    } else {
      setReferenceFile(incoming);
    }
  };

  const handleGenerate = async () => {
    if (!transcriptFile) {
      setError('Please upload a transcript to continue.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const transcriptContent = await transcriptFile.text();
      const referenceContent = referenceFile ? await referenceFile.text() : null;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptContent,
          reference: referenceContent,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate');
      }

      const data = await res.json();
      setResponse(data.message);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-2xl shadow-zinc-500/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25rem] text-emerald-500">
              Step 1
            </p>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Upload your transcript
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Plain text files only. We&apos;ll parse it on-device before sending.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            Required
          </span>
        </div>

        <label
          htmlFor="transcript-input"
          className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-5 text-sm font-medium text-zinc-700 transition hover:border-emerald-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <span className="text-base font-semibold">Clinical transcript (.txt)</span>
          <input
            id="transcript-input"
            type="file"
            accept=".txt"
            onChange={(e) => handleFileChange(e, 'transcript')}
            className="text-sm text-zinc-500"
            disabled={loading}
          />
          {transcriptFile && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Selected: {transcriptFile.name}
            </p>
          )}
        </label>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25rem] text-sky-500">
              Step 2
            </p>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Optional reference context
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Add clinical guidelines or prior SOAP notes as reference material.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
            Optional
          </span>
        </div>

        <label
          htmlFor="reference-input"
          className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-6 py-5 text-sm font-medium text-zinc-700 transition hover:border-sky-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <span className="text-base font-semibold">Reference material (.txt)</span>
          <input
            id="reference-input"
            type="file"
            accept=".txt"
            onChange={(e) => handleFileChange(e, 'reference')}
            className="text-sm text-zinc-500"
            disabled={loading}
          />
          {referenceFile ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Selected: {referenceFile.name}
            </p>
          ) : (
            <p className="text-xs text-zinc-400">You can skip this step.</p>
          )}
        </label>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.25rem] text-purple-500">
          Step 3
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <label htmlFor="model-select" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Choose a model
          </label>
          <select
            id="model-select"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
            disabled={loading}
          >
            {modelOptions.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            We&apos;ll route the generation request to the model you prefer.
          </p>
        </div>
      </section>

      <button
        onClick={handleGenerate}
        disabled={!transcriptFile || loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Generating SOAP Note...' : 'Generate SOAP Note'}
      </button>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {response && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {response}
        </div>
      )}
    </div>
  );
}

