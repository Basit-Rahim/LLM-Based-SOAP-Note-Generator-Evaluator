import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-emerald-900 py-16 text-zinc-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_50%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 lg:flex-row lg:items-start">
        <section className="flex-1 space-y-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3rem] text-emerald-300">
            Real-time SOAP
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Generate polished SOAP notes from raw transcripts—fast.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-200">
            Upload the clinical transcript, optionally add a reference document, then choose your preferred model. We&apos;ll handle the parsing, alignment, and summarization so you can stay focused on patient care.
          </p>
          <div className="grid gap-5 text-sm text-zinc-200 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.35rem] text-emerald-300">01</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Upload transcript</h3>
              <p className="mt-2 text-sm">
                Attach the raw conversation or clinic visit transcript in .txt format.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.35rem] text-emerald-300">02</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Add reference (optional)</h3>
              <p className="mt-2 text-sm">
                Supply prior SOAPs or guidelines for tighter alignment. Skip if not needed.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-200">
            <p className="text-xs uppercase tracking-[0.35rem] text-purple-300">03</p>
            <h3 className="mt-3 text-xl font-semibold text-white">Select a model</h3>
            <p className="mt-2">
              Route the generation to GPT-4o, GPT-4o Mini, or a custom deployment. Each request is logged for traceability.
            </p>
          </div>
        </section>

        <section className="flex-1">
          <FileUpload />
        </section>
      </div>
    </main>
  );
}
