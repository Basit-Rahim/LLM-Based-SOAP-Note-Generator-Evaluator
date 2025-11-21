import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-emerald-900 py-16 text-zinc-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_50%)]" />
      <div className="mx-auto w-full max-w-[90rem] space-y-8 px-6">
        <div className="space-y-4 lg:ml-auto lg:max-w-5xl">
          <h3 className="text-xl font-semibold leading-tight text-white sm:text-2xl lg:text-3xl">
            Upload transcripts and generate SOAP notes
          </h3>
        </div>
        <div className="w-full">
          <FileUpload />
        </div>
      </div>
    </main>
  );
}
