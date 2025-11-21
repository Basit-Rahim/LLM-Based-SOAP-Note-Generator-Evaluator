'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const modelOptions = [
  { id: 'gpt-4o-mini', label: 'GPT · 4o mini' },
  { id: 'gpt-4o', label: 'GPT · 4o' },
  { id: 'gpt-4.1-mini', label: 'GPT · 4.1 mini' },
  { id: 'models/gemini-2.5-flash', label: 'Gemini · 2.5 Flash' },
];

const workflowSteps = [
  {
    id: '01',
    title: 'Upload transcript',
    description: 'Drop in the raw conversation or visit summary as a .txt file.',
  },
  {
    id: '02',
    title: 'Add reference (optional)',
    description: 'Attach guidelines or prior SOAP notes to keep the model grounded.',
  },
  {
    id: '03',
    title: 'Select a provider',
    description: 'Choose between OpenAI GPT-4o mini or Gemini 1.5 Flash.',
  },
];

export default function FileUpload() {
  const router = useRouter();
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

      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('soap_transcript', transcriptContent);
          window.localStorage.setItem('soap_model', selectedModel);

          if (referenceContent) {
            window.localStorage.setItem('soap_reference', referenceContent);
            window.localStorage.setItem('soap_has_reference', 'true');
          } else {
            window.localStorage.removeItem('soap_reference');
            window.localStorage.setItem('soap_has_reference', 'false');
          }
          window.localStorage.removeItem('soap_results');
          window.localStorage.removeItem('soap_metrics');
          window.localStorage.setItem('soap_generation_in_progress', 'true');
          window.localStorage.setItem('soap_evaluation_in_progress', 'false');
        }
      } catch (storageError) {
        console.error('Failed to persist SOAP data to localStorage', storageError);
      }

      router.push('/results');
    } catch (err) {
      setError('An error occurred while preparing the request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-[90rem] flex-col gap-8 text-zinc-50 lg:flex-row">
      <aside className="sticky top-24 h-fit w-full flex-shrink-0 flex-col rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur sm:w-72 lg:w-56">
        <p className="text-xs font-semibold uppercase tracking-[0.35rem] text-emerald-300">
          Workflow
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          Follow the steps from top to bottom. Everything stays visible on the left.
        </p>
        <nav className="mt-5 flex flex-col gap-4">
          {workflowSteps.map((step) => (
            <div
              key={step.id}
              className="flex gap-3 rounded-2xl border border-transparent p-3 transition hover:border-white/20 hover:bg-white/5"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.35rem] text-zinc-500">
                {step.id}
              </span>
              <div>
                <p className="text-base font-semibold text-white">{step.title}</p>
                <p className="text-xs text-zinc-400">{step.description}</p>
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <section className="gap-6 rounded-2xl border border-white/10 bg-black/10 p-6 text-left text-sm shadow-inner lg:grid lg:grid-cols-[170px,1fr]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.4rem] text-emerald-300">
              Step 01
            </p>
            <h3 className="text-xl font-semibold text-white">Upload transcript</h3>
            <p className="text-sm text-zinc-400">
              Plain text (.txt) transcript captured from the encounter.
            </p>
          </div>
          <label
            htmlFor="transcript-input"
            className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-white/20 bg-black/20 px-6 py-5 text-sm font-medium text-zinc-100 transition hover:border-emerald-400/60 hover:bg-black/10"
          >
            <span className="text-base font-semibold">Clinical transcript (.txt)</span>
            <input
              id="transcript-input"
              type="file"
              accept=".txt"
              onChange={(e) => handleFileChange(e, 'transcript')}
              className="text-sm text-zinc-200 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1 file:text-emerald-200"
              disabled={loading}
            />
            {transcriptFile && (
              <p className="text-xs text-zinc-400">Selected: {transcriptFile.name}</p>
            )}
          </label>
        </section>

        <section className="gap-6 rounded-2xl border border-white/10 bg-black/10 p-6 text-left text-sm shadow-inner lg:grid lg:grid-cols-[170px,1fr]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.4rem] text-sky-300">
              Step 02
            </p>
            <h3 className="text-xl font-semibold text-white">Upload reference</h3>
            <p className="text-sm text-zinc-400">
              Optional grounding material such as guidelines or prior SOAP notes.
            </p>
          </div>
          <label
            htmlFor="reference-input"
            className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-white/20 bg-black/20 px-6 py-5 text-sm font-medium text-zinc-100 transition hover:border-sky-400/60 hover:bg-black/10"
          >
            <span className="text-base font-semibold">Reference document (.txt)</span>
            <input
              id="reference-input"
              type="file"
              accept=".txt"
              onChange={(e) => handleFileChange(e, 'reference')}
              className="text-sm text-zinc-200 file:mr-4 file:rounded-full file:border-0 file:bg-sky-500/20 file:px-3 file:py-1 file:text-sky-200"
              disabled={loading}
            />
            {referenceFile ? (
              <p className="text-xs text-zinc-400">Selected: {referenceFile.name}</p>
            ) : (
              <p className="text-xs text-zinc-500">This step can be skipped.</p>
            )}
          </label>
        </section>

        <section className="gap-6 rounded-2xl border border-white/10 bg-black/10 p-6 text-left text-sm shadow-inner lg:grid lg:grid-cols-[170px,1fr]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.4rem] text-purple-300">
              Step 03
            </p>
            <h3 className="text-xl font-semibold text-white">Select model</h3>
            <p className="text-sm text-zinc-400">
              Choose one model (GPT or Gemini) to generate the SOAP note.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="model-select" className="text-sm font-medium text-zinc-200">
              Model
            </label>
            <select
              id="model-select"
              className="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600/40"
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              disabled={loading}
            >
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id} className="bg-zinc-900 text-white">
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="gap-6 rounded-2xl border border-white/10 bg-black/10 p-6 text-left text-sm shadow-inner lg:grid lg:grid-cols-[170px,1fr] lg:items-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.4rem] text-emerald-300">
              Submit
            </p>
            <p className="text-sm text-zinc-400">Generate the SOAP draft when ready.</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!transcriptFile || loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Generating SOAP Note...' : 'Generate SOAP Note'}
          </button>
        </section>

        <div className="space-y-4">
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
      </div>
    </div>
  );
}

